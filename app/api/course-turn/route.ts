import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api-rate-limit";

type CourseTurnRequest = {
  mode: "translation" | "conversation";
  answer: string;
  targetPattern?: { id: number; pattern: string; modelAnswer: string; hint: string };
  lesson: {
    day: number;
    title: string;
    role: string;
    goal: string;
    event: string;
  };
  turn: number;
  storyBeat: "transaction" | "change" | "personal" | "closing";
  recentMessages: Array<{ role: string; text: string }>;
  availablePatterns: Array<{ id: number; pattern: string }>;
  memories: Array<{ category: string; text: string }>;
};

type CourseTurnResult = {
  source: "deepseek" | "fallback";
  communicationSucceeded: boolean;
  targetPatternUsed: boolean;
  needsImmediateRetry: boolean;
  mainIssue: string;
  rewrite: string;
  explanation: string;
  nextLine: string;
  usedPatternIds: number[];
  expressionDimensions: string[];
  newMemories: Array<{ category: "preference" | "habit" | "experience" | "opinion" | "goal"; text: string }>;
};

const japaneseText = (text: string) => /[\u3040-\u30ff\u3400-\u9fff]/.test(text);

const patternMarkers: Record<number, RegExp> = {
  14: /てほしい/,
  19: /なぜか.*から|というのは.*から/,
  25: /てくれませんか/,
  28: /てもらえませんか/,
  34: /かどうか/,
  39: /と思ったのに|と思ってたのに/,
  94: /せっかく.*のに/,
  121: /思ったより/,
  144: /たいんですが/,
  146: /てもいいですか/,
  148: /ていただけませんか/,
  149: /あるんですけど|あるんだけど/
};

const fallbackLines: Record<number, string[]> = {
  1: [
    "かしこまりました。窓側と奥の席でしたら、どちらがよろしいですか。",
    "本日はアイスコーヒーの大きいサイズが売り切れですが、普通サイズでもよろしいですか。",
    "普段も外で食事をすることが多いですか。それとも家で料理しますか。",
    "よく作る料理と、その理由も教えてください。",
    "ありがとうございます。最後に何か確認しておきたいことはございますか。"
  ],
  2: [
    "承知しました。苦手な食材やアレルギーはございますか。",
    "申し訳ございません。その食材だけを抜くことはできません。別の料理になさいますか。",
    "普段はどんな味の料理を選ぶことが多いですか。",
    "その味が好きになったきっかけも教えてください。",
    "では、変更した内容でご用意いたします。ほかにご希望はございますか。"
  ],
  3: [
    "かしこまりました。ほかに追加で必要なものはございますか。",
    "確認したところ、あと十五分ほどかかるそうです。お待ちになりますか。",
    "料理を食べる順番にはこだわりがありますか。",
    "その習慣ができた理由を、具体的な例と一緒に教えてください。",
    "お待ちになるか、別の料理に変えるか、どちらになさいますか。"
  ],
  4: [
    "大変申し訳ございません。ご注文の内容をもう一度教えていただけますか。",
    "作り直すと十五分ほどかかります。別の料理ならすぐにご用意できますが、どうなさいますか。",
    "以前にも、お店で注文と違うものが来たことはありますか。",
    "そのときどう対応して、どんな気持ちになったか詳しく教えてください。",
    "承知しました。では、その方法で対応いたします。ほかに確認したいことはございますか。"
  ]
};

const fallbackResult = (body: CourseTurnRequest): CourseTurnResult => {
  const targetUsed = body.targetPattern
    ? (patternMarkers[body.targetPattern.id]?.test(body.answer) ?? body.answer.includes(body.targetPattern.pattern.replace(/[～〜]/g, "")))
    : false;
  const communicationSucceeded = japaneseText(body.answer) && body.answer.trim().length >= 2;
  const lines = fallbackLines[body.lesson.day] ?? fallbackLines[1];
  const nextLine = lines[body.turn % lines.length];

  return {
    source: "fallback",
    communicationSucceeded,
    targetPatternUsed: targetUsed,
    needsImmediateRetry: !communicationSucceeded,
    mainIssue: communicationSucceeded
      ? targetUsed || body.mode === "conversation"
        ? "意思清楚，可以继续。"
        : "表达能够成立，但这次还没有调用目标句式。"
      : "这句话暂时无法完成当前沟通，请用日语再说一次。",
    rewrite: body.targetPattern?.modelAnswer ?? body.answer,
    explanation: targetUsed
      ? "目标结构已经自然出现。"
      : body.mode === "translation"
        ? `保留你的意思，再尝试使用「${body.targetPattern?.pattern ?? "目标句式"}」。`
        : "先把意思说清楚，句式会在后续情境中再次出现。",
    nextLine,
    usedPatternIds: targetUsed && body.targetPattern ? [body.targetPattern.id] : [],
    expressionDimensions: body.answer.length >= 28 ? ["事实", "理由"] : ["事实"],
    newMemories: []
  };
};

const asBoolean = (value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback;
const asText = (value: unknown, fallback = "") => typeof value === "string" ? value.slice(0, 240) : fallback;
const allowedDimensions = new Set(["事实", "理由", "例子", "比较", "感受", "观点"]);
const allowedCategories = new Set(["preference", "habit", "experience", "opinion", "goal"]);

const normalizeResult = (value: unknown, body: CourseTurnRequest): CourseTurnResult => {
  const fallback = fallbackResult(body);
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const usedPatternIds = Array.isArray(data.usedPatternIds)
    ? data.usedPatternIds.map(Number).filter((id) => body.availablePatterns.some((pattern) => pattern.id === id))
    : fallback.usedPatternIds;
  const expressionDimensions = Array.isArray(data.expressionDimensions)
    ? data.expressionDimensions.filter((item): item is string => typeof item === "string" && allowedDimensions.has(item))
    : fallback.expressionDimensions;
  const newMemories = Array.isArray(data.newMemories)
    ? data.newMemories.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const memory = item as Record<string, unknown>;
        if (!allowedCategories.has(String(memory.category)) || typeof memory.text !== "string") return [];
        return [{ category: memory.category as CourseTurnResult["newMemories"][number]["category"], text: memory.text.slice(0, 80) }];
      }).slice(0, 2)
    : [];

  return {
    source: "deepseek",
    communicationSucceeded: asBoolean(data.communicationSucceeded, fallback.communicationSucceeded),
    targetPatternUsed: asBoolean(data.targetPatternUsed, fallback.targetPatternUsed),
    needsImmediateRetry: asBoolean(data.needsImmediateRetry, fallback.needsImmediateRetry),
    mainIssue: asText(data.mainIssue, fallback.mainIssue),
    rewrite: asText(data.rewrite, fallback.rewrite),
    explanation: asText(data.explanation, fallback.explanation),
    nextLine: asText(data.nextLine, fallback.nextLine),
    usedPatternIds,
    expressionDimensions,
    newMemories
  };
};

export async function POST(request: Request) {
  if (isRateLimited(request, "course", 150, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试。" }, { status: 429 });
  }
  const body = await request.json() as CourseTurnRequest;
  if (!body.answer?.trim() || body.answer.length > 1200 || !body.lesson || !Array.isArray(body.recentMessages)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json(fallbackResult(body));

  const systemPrompt = [
    "你是日语口语课程中的对话导演和后台评估器。只返回合法 JSON，不要 Markdown。",
    "学习者约 N2，理解力较好但输出弱。角色台词必须只使用自然日语；纠错说明使用简短中文。",
    "把沟通成功与目标句式调用分开判断。生活中常用且符合语境的回答必须算沟通成功，不能因未使用目标句式判错。",
    "只有答非所问、无法理解或严重失礼时 needsImmediateRetry 才为 true。普通语法错误不能中断对话。",
    "nextLine 必须扮演 lesson.role，承接学习者刚才的具体内容，并提出一个能回答的问题。不得讲语法、重复上一问或结束对话。",
    "按照 storyBeat 推进：transaction 完成事务；change 引入变化；personal 追问习惯、理由、经历或感受；closing 自然收尾。",
    "回答短时先问具体问题，再逐步要求理由和例子；不要直接索要长篇演讲。",
    "targetPatternUsed 只判断学习者是否实际使用，不要因为语义相近而设为 true。usedPatternIds 识别自然出现的全部可用句式。",
    "expressionDimensions 只能从 事实、理由、例子、比较、感受、观点 中选择。",
    "newMemories 只提炼明确的个人偏好、习惯、经历、观点或目标；不要保存临时订单、敏感信息或未经证实的推断。最多两条。",
    "JSON 字段必须为 communicationSucceeded,targetPatternUsed,needsImmediateRetry,mainIssue,rewrite,explanation,nextLine,usedPatternIds,expressionDimensions,newMemories。"
  ].join("\n");

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.55,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(body) }
        ]
      })
    });
    if (!response.ok) return NextResponse.json(fallbackResult(body));
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return NextResponse.json(fallbackResult(body));
    return NextResponse.json(normalizeResult(JSON.parse(content), body));
  } catch {
    return NextResponse.json(fallbackResult(body));
  }
}
