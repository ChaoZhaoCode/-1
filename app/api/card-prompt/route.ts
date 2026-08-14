import { NextResponse } from "next/server";

type TargetPattern = {
  id: string;
  pattern: string;
  group?: "request" | "reason" | "opinion" | "emotion";
  meaning: string;
  structureHint?: string;
  modelAnswer?: string;
};

type CardPromptRequest = {
  targetPattern?: TargetPattern;
  previousPrompts?: string[];
  round?: number;
};

type CardPromptResponse = {
  prompt: string;
  modelAnswer: string;
  source: "generated" | "imported";
};

const fallbackPrompts: Record<NonNullable<TargetPattern["group"]>, string[]> = {
  request: [
    "不好意思，你想请对方帮你把饮料换成热的。",
    "你想请对方再确认一次预约时间。",
    "你想请店员帮你把这个改成外带。"
  ],
  reason: [
    "你想说明自己不是不想去，而是今天状态不太好。",
    "你想解释方便不是距离近，而是不用换乘。",
    "你想说明学习方法要看每个人的情况。"
  ],
  opinion: [
    "你想表达只背单词不一定能说好日语。",
    "你想表达这个安排有点不现实。",
    "你想表达不同场合说法会不一样。"
  ],
  emotion: [
    "你想表达特意准备了，结果没有派上用场。",
    "你想表达以为很简单，结果比想象中难。",
    "你想表达被那样说以后，受伤也是可以理解的。"
  ]
};

const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const fallbackPrompt = (body: CardPromptRequest): CardPromptResponse => {
  const target = body.targetPattern;
  const group = target?.group ?? "opinion";
  const candidates = fallbackPrompts[group];
  const index = Math.max(0, ((body.round ?? 1) - 1) % candidates.length);

  return {
    prompt: candidates[index],
    modelAnswer: target?.modelAnswer ?? target?.structureHint ?? `${target?.pattern ?? ""}：____`,
    source: "generated"
  };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CardPromptRequest;

  if (!body.targetPattern?.id) {
    return NextResponse.json({ error: "targetPattern is required" }, { status: 400 });
  }

  const fallback = fallbackPrompt(body);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  const systemPrompt = [
    "你是日语口语输出卡片的出题老师。",
    "请为 N2 学习者生成一个新的中文意图，让他必须调动目标句式说成自然日语。",
    "只返回 JSON，不要 Markdown。",
    "JSON 字段必须是 prompt, modelAnswer。",
    "prompt 用中文，短一点，像真实生活意图，不要解释语法。",
    "modelAnswer 用自然日语，必须使用目标句式或非常接近的结构。",
    "不要重复 previousPrompts 里的题目。"
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
        temperature: 0.55,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify(
              {
                targetPattern: body.targetPattern,
                previousPrompts: body.previousPrompts ?? [],
                round: body.round ?? 1
              },
              null,
              2
            )
          }
        ]
      })
    });

    if (!response.ok) return NextResponse.json(fallback);

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json(fallback);

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const prompt = toText(parsed.prompt);
    const modelAnswer = toText(parsed.modelAnswer);

    if (!prompt || !modelAnswer) return NextResponse.json(fallback);

    return NextResponse.json({
      prompt,
      modelAnswer,
      source: "generated"
    } satisfies CardPromptResponse);
  } catch {
    return NextResponse.json(fallback);
  }
}
