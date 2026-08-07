import { NextResponse } from "next/server";

type TargetPattern = {
  id: string;
  pattern: string;
  group?: string;
  meaning: string;
  structureHint: string;
  modelAnswer?: string;
};

type EvaluateRequest = {
  mode: "card" | "practice" | "retry" | "conversation";
  userAnswer: string;
  targetPattern: TargetPattern;
  prompt: string;
  scene?: {
    title: string;
    description: string;
    aiLine?: string;
  };
  conversationHistory?: Array<{ role: "ai" | "user" | "coach"; text: string }>;
  attempt?: number;
};

type Evaluation = {
  source: "deepseek" | "mock";
  passed: boolean;
  targetUsed: boolean;
  equivalentAccepted: boolean;
  naturalness: number;
  accuracy: number;
  mainIssue: string;
  rewrite: string;
  explanation: string;
  nextPrompt: string;
  retryPrompt: string;
  fillInHint: string;
};

const toText = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => toText(item, "")).filter(Boolean).join(" / ") || fallback;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["mainIssue", "rewrite", "explanation", "nextPrompt", "retryPrompt", "fillInHint", "message"]) {
      const text = toText(record[key], "");
      if (text) return text;
    }
  }
  return fallback;
};

const toScore = (value: unknown, fallback: number) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.max(1, Math.min(10, Math.round(numeric)));
  return fallback;
};

const toBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "yes", "1"].includes(value.toLowerCase());
  return fallback;
};

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max).trim()}...` : text);

const patternMatchers: Record<string, RegExp> = {
  "te-itadakemasenka": /ていただけませんか|ていただけますか|ていただきたい/i,
  temoraemasenka: /てもらえませんか|てもらえますか|てもらいたい/i,
  taindesuga: /たいんですが|たいのですが|たいですけど/i,
  arundesukedo: /あるんですけど|あるのですが|ありまして/i,
  temoiidesuka: /てもいいですか|てもよろしいですか/i,
  nazekatoiuto: /なぜかというと|なぜなら|というのも/i,
  toiunoha: /というのは|とは|という意味/i,
  "toiuka-nantoika": /というか|なんというか|なんか/i,
  karaniwa: /からには/i,
  "niyotte-chigau": /によって違|次第|場合によ/i,
  "とはかぎらない": /とは限らない|とはかぎりません|とは言えない/i,
  kigasuru: /気がする|感じがする|ように思う/i,
  hougaii: /ほうがいい|方がいい|べき/i,
  "muriga-aru": /無理がある|難しい|厳しい/i,
  ichigainiienai: /一概に.*言えない|とは一概に言えない/i,
  "sekkaku-noni": /せっかく.*のに/i,
  toomottanoni: /と思ったのに/i,
  wakejanai: /わけじゃない|わけではない/i,
  temookashikunai: /てもおかしくない/i,
  "nomomuriwa-nai": /のも無理はない|ても無理はない/i
};

const detectPatternUse = (answer: string, targetPattern: TargetPattern) => {
  const matcher = patternMatchers[targetPattern.id];
  if (matcher?.test(answer)) return true;
  const compactPattern = targetPattern.pattern.replace(/[〜~A-Za-z\s]/g, "");
  return compactPattern.length >= 3 && answer.includes(compactPattern);
};

const hasJapanese = (answer: string) => /[\u3040-\u30ff\u3400-\u9fff]/.test(answer);

const hasCommonNaturalEquivalent = (answer: string, targetPattern: TargetPattern) => {
  const commonRequest = /お願いします|ください|お願いできますか|よろしいですか|大丈夫ですか/.test(answer);
  const softOpinion = /と思います|気がします|かもしれません|ではないと思います/.test(answer);
  if (targetPattern.group === "request") return commonRequest;
  return softOpinion;
};

const makeConversationNextPrompt = (body: EvaluateRequest) => {
  const answer = body.userAnswer;
  const sceneText = `${body.scene?.title ?? ""} ${body.scene?.description ?? ""}`;

  if (/餐厅|便利店|椁愬巺|渚垮埄/.test(sceneText)) {
    if (/定食|セット|ご飯|丼|ラーメン|カレー/.test(answer)) {
      return "かしこまりました。ご飯の量は普通でよろしいですか。";
    }
    if (/コーラ|水|お茶|飲み物|ビール|ドリンク/.test(answer)) {
      return "かしこまりました。お飲み物は食事と一緒にお持ちしてもよろしいですか。";
    }
    if (/以上|大丈夫|それだけ|ほか/.test(answer)) {
      return "ありがとうございます。店内でお召し上がりですか、お持ち帰りですか。";
    }
    return "かしこまりました。ほかに追加したいものはございますか。";
  }

  if (/邀约|拒绝|飲み|閭€|鎷掔粷/.test(sceneText)) {
    if (/来週|次|また|今度/.test(answer)) return "分かりました。では、来週の金曜日ならどうですか。";
    if (/疲|忙|予定|難しい/.test(answer)) return "そうなんですね。無理しないでください。別の日なら少し余裕がありますか。";
    return "なるほど。では、都合のいい日があれば教えてください。";
  }

  if (/观点|生活|考え|鐢熸椿/.test(sceneText)) {
    if (/なぜ|から|と思|気がする/.test(answer)) return "なるほど。では、その考えが変わったきっかけはありますか。";
    return "面白いですね。もう少し具体的な例で言うと、どんな場面ですか。";
  }

  return "なるほど。では、もう少し詳しく教えてください。";
};

const semiCompletedHint = (targetPattern: TargetPattern) => {
  const hints: Record<string, string> = {
    "te-itadakemasenka": "すみません、____を少なめにしていただけませんか。",
    temoraemasenka: "すみません、もう一度____てもらえませんか。",
    taindesuga: "____したいんですが、____できますか。",
    arundesukedo: "____があるんですけど、____してもいいですか。",
    temoiidesuka: "____してもいいですか。",
    nazekatoiuto: "____です。なぜかというと、____からです。",
    toiunoha: "____というのは、____ということです。",
    "toiuka-nantoika": "____というか、なんというか、____感じです。",
    karaniwa: "____するからには、____したいです。",
    "niyotte-chigau": "____は____によって違うと思います。",
    "とはかぎらない": "____からといって、____とは限りません。",
    kigasuru: "____ような気がします。",
    hougaii: "____より、____ほうがいいと思います。",
    "muriga-aru": "____するには少し無理があります。",
    ichigainiienai: "一概に____とは言えません。",
    "sekkaku-noni": "せっかく____のに、____。",
    toomottanoni: "____と思ったのに、____。",
    wakejanai: "____わけじゃないんですが、____。",
    temookashikunai: "____てもおかしくないと思います。",
    "nomomuriwa-nai": "____のも無理はないと思います。"
  };
  return hints[targetPattern.id] ?? targetPattern.structureHint;
};

const normalizeEvaluation = (value: unknown, fallback: Evaluation): Evaluation => {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const targetUsed = toBoolean(record.targetUsed, fallback.targetUsed);
  const equivalentAccepted = targetUsed ? false : toBoolean(record.equivalentAccepted, fallback.equivalentAccepted);
  const rawNaturalness = toScore(record.naturalness, fallback.naturalness);
  const rawAccuracy = toScore(record.accuracy, fallback.accuracy);
  const passed = toBoolean(
    record.passed,
    fallback.passed || (rawNaturalness >= 7 && rawAccuracy >= 7 && (targetUsed || equivalentAccepted))
  );
  const naturalness = passed && (targetUsed || equivalentAccepted) ? Math.max(7, rawNaturalness) : rawNaturalness;
  const accuracy = passed && targetUsed ? Math.max(7, rawAccuracy) : rawAccuracy;

  return {
    source: fallback.source,
    passed,
    targetUsed,
    equivalentAccepted,
    naturalness,
    accuracy,
    mainIssue: clip(toText(record.mainIssue, fallback.mainIssue), 90),
    rewrite: clip(toText(record.rewrite, fallback.rewrite), 150),
    explanation: clip(toText(record.explanation, fallback.explanation), 180),
    nextPrompt: clip(toText(record.nextPrompt, fallback.nextPrompt), 120),
    retryPrompt: clip(toText(record.retryPrompt, fallback.retryPrompt), 130),
    fillInHint: clip(toText(record.fillInHint, fallback.fillInHint), 120)
  };
};

const mockEvaluation = (body: EvaluateRequest, source: "deepseek" | "mock" = "mock"): Evaluation => {
  const answer = body.userAnswer.trim();
  const targetUsed = detectPatternUse(answer, body.targetPattern);
  const equivalentAccepted = !targetUsed && hasCommonNaturalEquivalent(answer, body.targetPattern);
  const meaningful = hasJapanese(answer) && answer.length >= 6;
  const conversationMode = body.mode === "conversation";
  const passed = meaningful && (conversationMode || targetUsed || equivalentAccepted || body.mode === "card");
  const fillInHint = body.attempt && body.attempt >= 2 ? semiCompletedHint(body.targetPattern) : body.targetPattern.structureHint;

  return {
    source,
    passed,
    targetUsed,
    equivalentAccepted,
    naturalness: passed ? (equivalentAccepted ? 7 : 8) : 5,
    accuracy: passed ? 8 : 5,
    mainIssue: conversationMode && passed
      ? "自然接住了当前对话，可以继续推进场景。"
      : passed
      ? equivalentAccepted
        ? "表达能用，但本轮句式还没有真正练到。"
        : "意思成立，句式功能也用上了。"
      : "先把意思说完整，并强制放入本轮句式。",
    rewrite: body.targetPattern.modelAnswer ?? fillInHint.replaceAll("____", "内容"),
    explanation: conversationMode && passed
      ? "这一轮按真实对话评估，不强制回到上一道翻译题。示范会给一个更完整或更礼貌的说法。"
      : passed
      ? "生活中常用说法可以接受；训练时仍会把目标句式放进示范，帮助你形成可调用结构。"
      : "这一轮不会推进。请保留原意，用提示里的结构重新说一次。",
    nextPrompt: conversationMode
      ? makeConversationNextPrompt(body)
      : body.scene?.title === "人际邀约与拒绝"
        ? "そうなんですね。では、来週なら少し時間がありますか。"
        : body.scene?.title === "生活观点表达"
          ? "なるほど。では、毎日続けるためには何が必要だと思いますか。"
          : "かしこまりました。ほかにご希望はございますか。",
    retryPrompt: "同じ意味で、今度はこの句式を必ず入れてもう一度言ってください。",
    fillInHint
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as EvaluateRequest;

  if (!body.userAnswer?.trim()) {
    return NextResponse.json({ error: "userAnswer is required" }, { status: 400 });
  }

  if (!body.targetPattern?.id) {
    return NextResponse.json({ error: "targetPattern is required" }, { status: 400 });
  }

  const fallback = mockEvaluation(body);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  const systemPrompt = [
    "你是日语输出训练教练，学习者约 N2，但口语输出弱。",
    "你的目标不是让学习者背标准答案，而是逼他在真实场景里调用句式并自然表达。",
    "只返回 JSON，不要 Markdown。",
    "字段必须包含：passed, targetUsed, equivalentAccepted, naturalness, accuracy, mainIssue, rewrite, explanation, nextPrompt, retryPrompt, fillInHint。",
    "评分标准：1 意思是否成立；2 是否使用目标句式或同功能自然表达；3 是否像真实日语而不是中文语法拼贴。",
    "如果生活中非常常用且自然，例如 お願いします、ください、よろしいですか，也可以接受为 equivalentAccepted。",
    "但是 practice/retry 模式中，如果没有用到本轮目标句式或强等价功能，passed 应为 false，让学习者重说。",
    "conversation 模式是通过后的连续场景对话：此时优先判断 learnerAnswer 是否自然回应 scene.aiLine 和 conversationHistory，不要再拿第一道中文翻译题要求学习者重说。",
    "conversation 模式下，targetPattern 只是升级建议；如果学习者的回复自然、符合当前 AI 台词并能让对话继续，即使没用目标句式也可以 passed=true。",
    "conversation 模式的 nextPrompt 必须承接 learnerAnswer 推进场景，例如确认数量、追加选择、换一个相关话题或制造轻微真实状况；不要重复上一轮问题。",
    "不要因为少一个 か 这类小问题大幅扣分；只在 explanation 中简短指出。",
    "rewrite 只给一句自然日语示范，尽量保留学习者原意。",
    "nextPrompt 必须是 AI 角色下一句日语台词，要让对话能继续，主动增加一点场景信息或难度。",
    "retryPrompt 用中文，要求学习者用同一意思重说。",
    "fillInHint 给可填空结构；attempt >= 2 时给半完成句。"
  ].join("\n");

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify(
              {
                mode: body.mode,
                prompt: body.prompt,
                scene: body.scene,
                conversationHistory: body.conversationHistory ?? [],
                attempt: body.attempt ?? 1,
                targetPattern: body.targetPattern,
                learnerAnswer: body.userAnswer
              },
              null,
              2
            )
          }
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        ...fallback,
        source: "mock",
        mainIssue: "DeepSeek API 暂时不可用，已使用本地规则反馈。"
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json(fallback);

    try {
      return NextResponse.json(normalizeEvaluation(JSON.parse(content), { ...fallback, source: "deepseek" }));
    } catch {
      return NextResponse.json({
        ...fallback,
        source: "mock",
        explanation: clip(String(content), 180)
      });
    }
  } catch {
    return NextResponse.json(fallback);
  }
}
