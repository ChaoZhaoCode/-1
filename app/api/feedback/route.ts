import { NextResponse } from "next/server";

type FeedbackRequest = {
  answer: string;
  levelTitle: string;
  sceneTitle: string;
  prompt: string;
  targetPatterns: string[];
  turnCount?: number;
  difficulty?: number;
  conversationHistory?: Array<{ role: string; text: string }>;
};

const toText = (value: unknown, fallback: string): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => toText(item, "")).filter(Boolean).join(" / ") || fallback;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = ["suggestion", "summary", "message", "explanation", "mainIssue"];
    const preferred = preferredKeys.map((key) => record[key]).find((item) => typeof item === "string");
    if (preferred) return preferred;

    return Object.entries(record)
      .map(([key, item]) => `${key}: ${toText(item, "")}`)
      .filter((item) => !item.endsWith(": "))
      .join("；") || fallback;
  }
  return fallback;
};

const toScore = (value: unknown, fallback: number) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.max(1, Math.min(10, Math.round(numeric)));
  return fallback;
};

const clipped = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const extractPreservedTerms = (answer: string) => {
  const matches = answer.match(/[\p{Script=Katakana}\p{Script=Han}ー]+/gu) ?? [];
  return Array.from(new Set(matches.filter((term) => term.length >= 1))).slice(0, 8);
};

const isRestaurantContext = (body?: FeedbackRequest) => {
  if (!body) return false;
  return /レストラン|注文|飲み物|ご注文|お飲み物/.test(`${body.sceneTitle} ${body.prompt}`);
};

const isCommonRestaurantReply = (answer: string) => {
  const hasOrderWord = /お願いします|おねがいします|ください|下さい|頂戴|ちょうだい|いただけ|もらえ|にします|でいいです|で大丈夫です/.test(answer);
  const hasItemOrCondition = /コーラ|水|お冷|氷|サイズ|少なめ|多め|普通|辛さ|サラダ|ビール|コーヒー|お願いします/.test(answer);
  return hasOrderWord && hasItemOrCondition;
};

const isMissingQuestionKa = (answer: string) => {
  return /いただけません$|いただけません。$|もらえません$|もらえません。$/.test(answer.trim());
};

const nextTurnFallbacks = [
  "かしこまりました。サイズはいかがなさいますか。",
  "氷はお入れしてもよろしいですか。",
  "セットのサラダもご一緒にいかがですか。",
  "お支払いは現金とカード、どちらになさいますか。",
  "申し訳ございません。こちらは本日売り切れですが、別のものになさいますか。"
];

const isAnswerablePrompt = (prompt: string) => {
  if (/お待ちください|少々お待ち|ございますね[。.]?$|かしこまりました[。.]?$/.test(prompt)) return false;
  return /[か？?]|どう|いかが|どちら|どれ|よろしい|なさいます|されます|お決まり|ございますか|ください|お願いします/.test(prompt);
};

const ensureAnswerableNextPrompt = (prompt: string, body?: FeedbackRequest) => {
  if (isAnswerablePrompt(prompt)) return prompt;
  const index = Math.min(nextTurnFallbacks.length - 1, Math.max(0, body?.turnCount ?? 0));
  return nextTurnFallbacks[index];
};

const normalizeFeedback = (value: unknown, source: "deepseek" | "mock", body?: FeedbackRequest) => {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const normalized = {
    source,
    naturalness: toScore(record.naturalness, 5),
    politeness: toScore(record.politeness, 5),
    mainIssue: clipped(toText(record.mainIssue, "这次回答还需要进一步明确问题点。"), 70),
    rewrite: clipped(toText(record.rewrite, "すみません、もう一度お願いします。"), 120),
    explanation: clipped(toText(record.explanation, "AI 返回的解释格式不稳定，已转成可显示文本。"), 120),
    nextPrompt: clipped(ensureAnswerableNextPrompt(toText(record.nextPrompt, "ほかにご注文はございますか。"), body), 90),
    patternCheck: clipped(toText(record.patternCheck, "本次未能稳定识别目标句式，请下一轮强制使用目标句式。"), 90)
  };

  const restaurantDrinkIntent = body?.sceneTitle.includes("レストラン") && /コーラ|氷/.test(body.answer);
  const lostDrinkIntent = restaurantDrinkIntent && !/コーラ|氷/.test(normalized.rewrite);
  if (lostDrinkIntent) {
    return {
      ...normalized,
      naturalness: Math.max(normalized.naturalness, 7),
      politeness: Math.max(normalized.politeness, 7),
      mainIssue: "意思清楚，但可以再柔和一点。",
      rewrite: "すみません、コーラを氷少なめでお願いできますか。",
      explanation: "保留“コーラ”和“少冰”，再用“お願いできますか”把请求变柔和。",
      nextPrompt: "かしこまりました。サイズはいかがなさいますか。"
    };
  }

  if (isRestaurantContext(body) && isCommonRestaurantReply(body?.answer ?? "")) {
    const missingKa = isMissingQuestionKa(body?.answer ?? "");
    return {
      ...normalized,
      naturalness: Math.max(normalized.naturalness, missingKa ? 7 : 8),
      politeness: Math.max(normalized.politeness, missingKa ? 8 : 7),
      mainIssue: missingKa ? "句尾补か会更完整，但表达能成立。" : normalized.mainIssue,
      explanation: missingKa
        ? "少了疑问的か会显得句子没收住，但礼貌意图明确，不应大幅扣分。"
        : normalized.explanation
    };
  }

  return normalized;
};

const mockFeedback = (body: FeedbackRequest) => {
  const knownStructures = [
    "いただけませんか",
    "もらえませんか",
    "たいんですが",
    "てもいいですか",
    "あるんですけど",
    "かどうか",
    "にとって",
    "てほしい"
  ];
  const usedPattern = knownStructures.find((pattern) => body.answer.includes(pattern));
  const polite = /いただけませんか|もらえませんか|たいんですが|ですか|ますか/.test(body.answer);

  return {
    source: "mock",
    naturalness: body.answer.length > 18 ? 7 : 5,
    politeness: polite ? 8 : 5,
    mainIssue: usedPattern
      ? "目标句式已经出现，但还需要让请求对象和理由更清楚。"
      : "回答能表达大意，但没有明显调用本轮目标句式，容易变成自由聊天。",
    rewrite: "すみません、氷を少なめにしていただけませんか。",
    explanation: "餐厅服务场景里，先用「すみません」缓冲，再用「～ていただけませんか」提出请求，会比直接命令自然。",
    nextPrompt: "辛さは普通でよろしいですか。",
    patternCheck: usedPattern
      ? `检测到你尝试使用包含「${usedPattern}」的结构。下一轮请把理由和请求拆成两句。`
      : `本轮建议强制使用：${body.targetPatterns.slice(0, 2).join(" / ")}。`
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as FeedbackRequest;

  if (!body.answer?.trim()) {
    return NextResponse.json({ error: "answer is required" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(mockFeedback(body));
  }

  const systemPrompt = [
    "你是严格但可执行的日语口语教练，服务对象是 N3-N1 但口语弱的中文母语者。",
    "你必须围绕指定场景和目标句式反馈，避免泛泛鼓励。",
      "请只返回 JSON，不要 Markdown。",
    "JSON 字段：source, naturalness, politeness, mainIssue, rewrite, explanation, nextPrompt, patternCheck。",
    "naturalness 和 politeness 是 1-10 的数字。rewrite 必须是自然日语。explanation 用中文。",
    "评分先看真实沟通是否成立：生活中常用且场景自然的说法不能因为没有使用目标句式而低分。",
    "「お願いします」「ください」「〜にします」等点单常用说法是可接受答案；目标句式只用于给更自然/更礼貌的示范。",
    "少一个疑问助词「か」通常是小问题：如果整体意思和礼貌度明确，不要因此扣到 5-6 分以下。",
    "首页反馈必须短：mainIssue 不超过 35 个汉字，explanation 不超过 55 个汉字。",
    "rewrite 是给学习者的示范答案，只写一句自然日语。",
    "nextPrompt 必须是 AI 扮演的日本人下一句台词，只写日语，不要中文说明，不要讲课。",
    "rewrite 必须保留 learnerAnswer 的真实意图、物品、条件和请求，不得改成无关内容。",
    "如果 userPrompt.preservedTerms 有内容，rewrite 必须尽量保留这些词或等价表达，不能把コーラ、氷、時間、場所等关键信息改掉。",
    "nextPrompt 必须承接当前场景和 learnerAnswer，例如餐厅点单就继续扮演店员确认、追问、推荐或处理突发情况。",
    "nextPrompt 绝对不能只是「少々お待ちください」「かしこまりました」这类结束语；必须让学习者有话可回。",
    "如果当前小流程自然结束，就主动增加相邻话题：尺寸、冰量、套餐、过敏、支付、缺货、点错单、座位、打包等。",
    "difficulty 1-2 时追问简单直接；3 时加入确认和补充条件；4-5 时自然换话题或增加突发情况。",
    "把详细句式判断压缩进 patternCheck，首页只会在侧栏简短展示。"
  ].join("\n");

  const userPrompt = {
    scene: body.sceneTitle,
    level: body.levelTitle,
    task: body.prompt,
    targetPatterns: body.targetPatterns,
    learnerAnswer: body.answer,
    turnCount: body.turnCount ?? 0,
    difficulty: body.difficulty ?? 1,
    conversationHistory: body.conversationHistory ?? [],
    preservedTerms: extractPreservedTerms(body.answer)
  };

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
          { role: "user", content: JSON.stringify(userPrompt, null, 2) }
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        ...mockFeedback(body),
        source: "mock",
        mainIssue: "DeepSeek API 暂时不可用，已切换为本地模拟反馈。"
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(mockFeedback(body));
    }

    try {
      return NextResponse.json(normalizeFeedback(JSON.parse(content), "deepseek", body));
    } catch {
      return NextResponse.json({
        ...mockFeedback(body),
        source: "mock",
        explanation: content
      });
    }
  } catch {
    return NextResponse.json(mockFeedback(body));
  }
}
