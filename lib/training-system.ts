export type PatternGroup = "request" | "reason" | "opinion" | "emotion";
export type SceneId = "commerce" | "social" | "opinion";
export type PatternStatus = "new" | "seen" | "used_in_scene" | "failed_in_scene" | "mastered";

export type TrainingPattern = {
  id: string;
  pattern: string;
  group: PatternGroup;
  meaning: string;
  structureHint: string;
  cardPrompt: string;
  modelAnswer: string;
  cardPrompts?: CardPrompt[];
  sceneFit: SceneId[];
};

export type CardPrompt = {
  prompt: string;
  modelAnswer: string;
  source: "generated" | "imported";
};

export type TrainingScene = {
  id: SceneId;
  title: string;
  description: string;
  opening: string;
  stageOnePrompt: string;
  stageTwoIntent: string;
  stageThreePrompt: string;
  suggestedPatternIds: string[];
};

export type PatternProgress = {
  status: PatternStatus;
  cardPasses: number;
  scenePasses: number;
  failures: number;
};

export type TrainingProgress = Record<string, PatternProgress>;

export const TRAINING_PROGRESS_KEY = "forced-output-training-progress-v1";

export const groupLabels: Record<PatternGroup, string> = {
  request: "请求与交涉",
  reason: "说明与理由",
  opinion: "判断与观点",
  emotion: "情绪与状况"
};

export const statusLabels: Record<PatternStatus, string> = {
  new: "未练",
  seen: "卡片通过",
  used_in_scene: "场景用过",
  failed_in_scene: "回炉",
  mastered: "掌握"
};

export const trainingPatterns: TrainingPattern[] = [
  {
    id: "te-itadakemasenka",
    pattern: "〜ていただけませんか",
    group: "request",
    meaning: "礼貌地请求对方为自己做某事",
    structureHint: "すみません、Aを少し〜ていただけませんか。",
    cardPrompt: "不好意思，可以帮我把冰少放一点吗？",
    modelAnswer: "すみません、氷を少なめにしていただけませんか。",
    sceneFit: ["commerce", "social"]
  },
  {
    id: "temoraemasenka",
    pattern: "〜てもらえませんか",
    group: "request",
    meaning: "请求对方帮忙，语气比いただく稍轻",
    structureHint: "悪いんだけど、Aを〜てもらえませんか。",
    cardPrompt: "不好意思，可以再说明一遍吗？",
    modelAnswer: "すみません、もう一度説明してもらえませんか。",
    sceneFit: ["commerce", "social"]
  },
  {
    id: "taindesuga",
    pattern: "〜たいんですが",
    group: "request",
    meaning: "先柔和地提出自己的愿望，再等待对方回应",
    structureHint: "Aしたいんですが、Bできますか。",
    cardPrompt: "我想预约明天晚上七点，两个人，可以吗？",
    modelAnswer: "明日の夜七時に二人で予約したいんですが、空いていますか。",
    sceneFit: ["commerce", "social"]
  },
  {
    id: "arundesukedo",
    pattern: "〜あるんですけど",
    group: "request",
    meaning: "先铺垫一个状况，再提出后续请求或问题",
    structureHint: "Aがあるんですけど、Bしてもいいですか。",
    cardPrompt: "我有一点过敏，想确认一下里面有没有坚果。",
    modelAnswer: "アレルギーがあるんですけど、ナッツが入っているか確認してもいいですか。",
    sceneFit: ["commerce", "social"]
  },
  {
    id: "temoiidesuka",
    pattern: "〜てもいいですか",
    group: "request",
    meaning: "请求许可，适合问能不能做某个动作",
    structureHint: "Aしてもいいですか。",
    cardPrompt: "我可以先把行李放在这里吗？",
    modelAnswer: "先に荷物をここに置いてもいいですか。",
    sceneFit: ["commerce", "social"]
  },
  {
    id: "nazekatoiuto",
    pattern: "なぜかというと〜から",
    group: "reason",
    meaning: "明确给出理由，适合把想法说完整",
    structureHint: "Aです。なぜかというと、Bからです。",
    cardPrompt: "我想坐里面的位置。因为外面有点冷。",
    modelAnswer: "中の席にしたいです。なぜかというと、外は少し寒いからです。",
    sceneFit: ["commerce", "opinion"]
  },
  {
    id: "toiunoha",
    pattern: "〜というのは",
    group: "reason",
    meaning: "解释某个词、状况或判断的含义",
    structureHint: "Aというのは、Bということです。",
    cardPrompt: "我说的方便，不是近，而是不用换乘。",
    modelAnswer: "便利というのは、近いという意味ではなく、乗り換えがないということです。",
    sceneFit: ["opinion", "social"]
  },
  {
    id: "toiuka-nantoika",
    pattern: "〜というか、なんというか",
    group: "reason",
    meaning: "寻找更贴切的表达，适合说复杂感受",
    structureHint: "Aというか、なんというか、B感じです。",
    cardPrompt: "不是讨厌，就是有点不知道怎么相处。",
    modelAnswer: "嫌いというか、なんというか、少し付き合い方が分からない感じです。",
    sceneFit: ["social", "opinion"]
  },
  {
    id: "karaniwa",
    pattern: "〜からには",
    group: "reason",
    meaning: "既然已经这样，就应该承担后续动作",
    structureHint: "Aするからには、Bしたいです。",
    cardPrompt: "既然要学日语，我想至少能说出自己的想法。",
    modelAnswer: "日本語を勉強するからには、せめて自分の考えを言えるようになりたいです。",
    sceneFit: ["opinion"]
  },
  {
    id: "niyotte-chigau",
    pattern: "〜によって違う",
    group: "reason",
    meaning: "根据对象、情况不同而变化",
    structureHint: "AはBによって違います。",
    cardPrompt: "我觉得适合的学习方法因人而异。",
    modelAnswer: "合う勉強方法は人によって違うと思います。",
    sceneFit: ["opinion", "social"]
  },
  {
    id: "とはかぎらない",
    pattern: "〜とは限らない",
    group: "opinion",
    meaning: "并不一定如此，避免说得太绝对",
    structureHint: "Aだからといって、Bとは限りません。",
    cardPrompt: "就算语法懂了，也不一定能说出口。",
    modelAnswer: "文法が分かっているからといって、話せるとは限りません。",
    sceneFit: ["opinion"]
  },
  {
    id: "kigasuru",
    pattern: "〜気がする",
    group: "opinion",
    meaning: "柔和表达自己的感觉或判断",
    structureHint: "Aような気がします。",
    cardPrompt: "我感觉这个说法有点太直接了。",
    modelAnswer: "この言い方は少し直接すぎる気がします。",
    sceneFit: ["opinion", "social"]
  },
  {
    id: "hougaii",
    pattern: "〜ほうがいい",
    group: "opinion",
    meaning: "提出建议或更好的选择",
    structureHint: "Aより、Bしたほうがいいと思います。",
    cardPrompt: "我觉得不要马上拒绝，先说明理由比较好。",
    modelAnswer: "すぐ断るより、先に理由を説明したほうがいいと思います。",
    sceneFit: ["social", "opinion"]
  },
  {
    id: "muriga-aru",
    pattern: "〜には無理がある",
    group: "opinion",
    meaning: "指出某个想法或安排不太现实",
    structureHint: "Aするには少し無理があります。",
    cardPrompt: "今天之内全部做完有点不现实。",
    modelAnswer: "今日中に全部終わらせるには少し無理があります。",
    sceneFit: ["social", "opinion"]
  },
  {
    id: "ichigainiienai",
    pattern: "一概に〜とは言えない",
    group: "opinion",
    meaning: "不能一概而论，适合表达复杂判断",
    structureHint: "一概にAとは言えません。",
    cardPrompt: "不能一概说住在日本日语就会变好。",
    modelAnswer: "日本に住めば日本語が上手になるとは一概に言えません。",
    sceneFit: ["opinion"]
  },
  {
    id: "sekkaku-noni",
    pattern: "せっかく〜のに",
    group: "emotion",
    meaning: "明明特意做了某事，却没有得到期待结果",
    structureHint: "せっかくAしたのに、Bでした。",
    cardPrompt: "我特意来了这家店，结果已经卖完了。",
    modelAnswer: "せっかくこの店まで来たのに、もう売り切れていました。",
    sceneFit: ["commerce", "opinion"]
  },
  {
    id: "toomottanoni",
    pattern: "〜と思ったのに",
    group: "emotion",
    meaning: "表达预期落空",
    structureHint: "Aと思ったのに、Bでした。",
    cardPrompt: "我以为今天会比较空，没想到人很多。",
    modelAnswer: "今日は空いていると思ったのに、思ったより人が多いです。",
    sceneFit: ["commerce", "social"]
  },
  {
    id: "wakejanai",
    pattern: "〜わけじゃない",
    group: "emotion",
    meaning: "不是完全否定，而是修正对方理解",
    structureHint: "Aわけじゃないんですが、Bです。",
    cardPrompt: "我不是讨厌聚会，只是不太擅长和很多人聊天。",
    modelAnswer: "飲み会が嫌いなわけじゃないんですが、大人数で話すのが少し苦手です。",
    sceneFit: ["social", "opinion"]
  },
  {
    id: "temookashikunai",
    pattern: "〜てもおかしくない",
    group: "emotion",
    meaning: "某事发生也不奇怪，表达合理推测",
    structureHint: "Aてもおかしくないと思います。",
    cardPrompt: "这么忙的话，出一点失误也不奇怪。",
    modelAnswer: "これだけ忙しければ、少しミスが出てもおかしくないと思います。",
    sceneFit: ["opinion", "social"]
  },
  {
    id: "nomomuriwa-nai",
    pattern: "〜のも無理はない",
    group: "emotion",
    meaning: "某种反应可以理解",
    structureHint: "Aのも無理はないと思います。",
    cardPrompt: "被那样说的话，感到受伤也是可以理解的。",
    modelAnswer: "あんなふうに言われたら、傷つくのも無理はないと思います。",
    sceneFit: ["social", "opinion"]
  }
];

export const trainingScenes: TrainingScene[] = [
  {
    id: "commerce",
    title: "餐厅 / 便利店交涉",
    description: "点单、确认、请求调整、处理售罄和听不懂。",
    opening: "いらっしゃいませ。ご注文はお決まりですか。",
    stageOnePrompt: "请用日语说：不好意思，我想点这个，不过冰可以少一点吗？",
    stageTwoIntent: "表达：你想买/点某个东西，但有一个具体请求或顾虑。",
    stageThreePrompt: "请自由回应店员，并主动补充一个条件、理由或后续问题。",
    suggestedPatternIds: [
      "te-itadakemasenka",
      "taindesuga",
      "arundesukedo",
      "nazekatoiuto",
      "sekkaku-noni",
      "toomottanoni"
    ]
  },
  {
    id: "social",
    title: "人际邀约与拒绝",
    description: "拒绝、解释边界、提出替代方案，避免太生硬。",
    opening: "今週の土曜日、みんなで飲みに行くんですが、来られますか。",
    stageOnePrompt: "请用日语说：我不是不想去，只是这周有点太累了，能不能下次再约？",
    stageTwoIntent: "表达：你不想直接拒绝，需要解释真实理由并留余地。",
    stageThreePrompt: "请自由回应对方邀请，并主动提出一个不尴尬的替代方案。",
    suggestedPatternIds: [
      "wakejanai",
      "temoraemasenka",
      "hougaii",
      "toiuka-nantoika",
      "muriga-aru",
      "nomomuriwa-nai"
    ]
  },
  {
    id: "opinion",
    title: "生活观点表达",
    description: "把意见说完整：判断、理由、例外、复杂感受。",
    opening: "日本語を話せるようになるには、何が一番大事だと思いますか。",
    stageOnePrompt: "请用日语说：我觉得不是背很多单词就一定能说好，关键是每天输出。",
    stageTwoIntent: "表达：你对学习、生活或工作有一个不绝对的观点，并说明理由。",
    stageThreePrompt: "请自由表达一个生活观点，至少包含判断、理由和一个例外。",
    suggestedPatternIds: [
      "とはかぎらない",
      "kigasuru",
      "ichigainiienai",
      "niyotte-chigau",
      "karaniwa",
      "toiunoha"
    ]
  }
];

export const createInitialProgress = (): TrainingProgress =>
  Object.fromEntries(
    trainingPatterns.map((pattern) => [
      pattern.id,
      { status: "new", cardPasses: 0, scenePasses: 0, failures: 0 } satisfies PatternProgress
    ])
  );

export const mergeProgress = (stored: unknown): TrainingProgress => {
  const base = createInitialProgress();
  if (!stored || typeof stored !== "object") return base;

  const incoming = stored as Record<string, Partial<PatternProgress>>;
  for (const pattern of trainingPatterns) {
    const item = incoming[pattern.id];
    if (!item) continue;
    base[pattern.id] = {
      status: item.status ?? "new",
      cardPasses: Number.isFinite(item.cardPasses) ? Number(item.cardPasses) : 0,
      scenePasses: Number.isFinite(item.scenePasses) ? Number(item.scenePasses) : 0,
      failures: Number.isFinite(item.failures) ? Number(item.failures) : 0
    };
  }

  return base;
};

export const getPatternById = (id: string) => trainingPatterns.find((pattern) => pattern.id === id) ?? trainingPatterns[0];

const generatedCardPromptSets: Record<string, CardPrompt[]> = {
  "te-itadakemasenka": [
    {
      prompt: "不好意思，可以帮我把冰少放一点吗？",
      modelAnswer: "すみません、氷を少なめにしていただけませんか。",
      source: "generated"
    },
    {
      prompt: "不好意思，可以把这个包起来吗？",
      modelAnswer: "すみません、これを包んでいただけませんか。",
      source: "generated"
    },
    {
      prompt: "不好意思，能不能帮我确认一下这个里面有没有坚果？",
      modelAnswer: "すみません、これにナッツが入っているか確認していただけませんか。",
      source: "generated"
    }
  ],
  temoraemasenka: [
    {
      prompt: "不好意思，可以再说明一遍吗？",
      modelAnswer: "すみません、もう一度説明してもらえませんか。",
      source: "generated"
    },
    {
      prompt: "不好意思，可以帮我看一下这个地址在哪里吗？",
      modelAnswer: "すみません、この住所がどこか見てもらえませんか。",
      source: "generated"
    },
    {
      prompt: "不好意思，刚才没听清，可以慢一点说吗？",
      modelAnswer: "すみません、さっき聞き取れなかったので、少しゆっくり話してもらえませんか。",
      source: "generated"
    }
  ],
  taindesuga: [
    {
      prompt: "我想预约明天晚上七点，两个人，可以吗？",
      modelAnswer: "明日の夜七時に二人で予約したいんですが、空いていますか。",
      source: "generated"
    },
    {
      prompt: "我想换成靠窗的位置，可以吗？",
      modelAnswer: "窓側の席に変えたいんですが、できますか。",
      source: "generated"
    },
    {
      prompt: "我想先确认一下价格，再决定要不要买。",
      modelAnswer: "先に値段を確認したいんですが、それから買うかどうか決めてもいいですか。",
      source: "generated"
    }
  ],
  arundesukedo: [
    {
      prompt: "我有一点过敏，想确认一下里面有没有坚果。",
      modelAnswer: "アレルギーがあるんですけど、ナッツが入っているか確認してもいいですか。",
      source: "generated"
    },
    {
      prompt: "我有一个问题，想问一下这个优惠券能不能用。",
      modelAnswer: "一つ質問があるんですけど、このクーポンは使えますか。",
      source: "generated"
    },
    {
      prompt: "我有点急事，可能会晚十分钟到。",
      modelAnswer: "少し急用があるんですけど、十分ほど遅れてしまうかもしれません。",
      source: "generated"
    }
  ],
  temoiidesuka: [
    {
      prompt: "我可以先把行李放在这里吗？",
      modelAnswer: "先に荷物をここに置いてもいいですか。",
      source: "generated"
    },
    {
      prompt: "我可以拍一下这个菜单吗？",
      modelAnswer: "このメニューを写真に撮ってもいいですか。",
      source: "generated"
    },
    {
      prompt: "我可以先看一下房间，再决定要不要入住吗？",
      modelAnswer: "先に部屋を見てもいいですか。それから泊まるかどうか決めたいです。",
      source: "generated"
    }
  ],
  nazekatoiuto: [
    {
      prompt: "我想坐里面的位置。因为外面有点冷。",
      modelAnswer: "中の席にしたいです。なぜかというと、外は少し寒いからです。",
      source: "generated"
    },
    {
      prompt: "我觉得每天输出很重要。因为只看是不够的。",
      modelAnswer: "毎日アウトプットすることが大事だと思います。なぜかというと、見るだけでは足りないからです。",
      source: "generated"
    },
    {
      prompt: "我现在想先休息一下。因为如果继续做，效率会越来越低。",
      modelAnswer: "今は先に少し休みたいです。なぜかというと、このまま続けると効率がどんどん下がるからです。",
      source: "generated"
    }
  ],
  toiunoha: [
    {
      prompt: "我说的方便，不是近，而是不用换乘。",
      modelAnswer: "便利というのは、近いという意味ではなく、乗り換えがないということです。",
      source: "generated"
    },
    {
      prompt: "我说的会说，不是会背句子，而是能在现场回应。",
      modelAnswer: "話せるというのは、文を暗記できるということではなく、その場で返せるということです。",
      source: "generated"
    },
    {
      prompt: "我说的自然，不是语法完全正确，而是听起来像生活里会说的话。",
      modelAnswer: "自然というのは、文法が完璧ということではなく、生活の中で言いそうに聞こえるということです。",
      source: "generated"
    }
  ],
  "toiuka-nantoika": [
    {
      prompt: "不是讨厌，就是有点不知道怎么相处。",
      modelAnswer: "嫌いというか、なんというか、少し付き合い方が分からない感じです。",
      source: "generated"
    },
    {
      prompt: "不是很忙，就是一直静不下心来。",
      modelAnswer: "忙しいというか、なんというか、ずっと落ち着かない感じです。",
      source: "generated"
    },
    {
      prompt: "不是不开心，就是感觉有点累，想一个人待一会儿。",
      modelAnswer: "楽しくないというか、なんというか、少し疲れていて、一人でいたい感じです。",
      source: "generated"
    }
  ],
  karaniwa: [
    {
      prompt: "既然要学日语，我想至少能说出自己的想法。",
      modelAnswer: "日本語を勉強するからには、せめて自分の考えを言えるようになりたいです。",
      source: "generated"
    },
    {
      prompt: "既然答应了，我想尽量做到最后。",
      modelAnswer: "引き受けたからには、できるだけ最後までやりたいです。",
      source: "generated"
    },
    {
      prompt: "既然要在日本生活，至少日常问题要能自己处理。",
      modelAnswer: "日本で生活するからには、せめて日常の問題は自分で対応できるようになりたいです。",
      source: "generated"
    }
  ],
  "niyotte-chigau": [
    {
      prompt: "我觉得适合的学习方法因人而异。",
      modelAnswer: "合う勉強方法は人によって違うと思います。",
      source: "generated"
    },
    {
      prompt: "礼貌程度会根据关系不同而变化。",
      modelAnswer: "丁寧さは相手との関係によって違います。",
      source: "generated"
    },
    {
      prompt: "我觉得同一句话在工作场合和朋友之间的说法会不一样。",
      modelAnswer: "同じ内容でも、仕事の場面と友達同士では言い方が違うと思います。",
      source: "generated"
    }
  ],
  "銇ㄣ伅銇嬨亷銈夈仾銇?": [
    {
      prompt: "就算语法懂了，也不一定能说出口。",
      modelAnswer: "文法が分かっているからといって、話せるとは限りません。",
      source: "generated"
    },
    {
      prompt: "住在日本也不一定日语就会自然变好。",
      modelAnswer: "日本に住んでいるからといって、日本語が自然に上手になるとは限りません。",
      source: "generated"
    },
    {
      prompt: "对方说没关系，也不一定是真的不介意。",
      modelAnswer: "相手が大丈夫だと言ったからといって、本当に気にしていないとは限りません。",
      source: "generated"
    }
  ],
  kigasuru: [
    {
      prompt: "我感觉这个说法有点太直接了。",
      modelAnswer: "この言い方は少し直接すぎる気がします。",
      source: "generated"
    },
    {
      prompt: "我感觉今天比平时人多。",
      modelAnswer: "今日はいつもより人が多い気がします。",
      source: "generated"
    },
    {
      prompt: "我感觉不是单词不够，而是反应速度跟不上。",
      modelAnswer: "単語が足りないというより、反応のスピードが追いついていない気がします。",
      source: "generated"
    }
  ],
  hougaii: [
    {
      prompt: "我觉得不要马上拒绝，先说明理由比较好。",
      modelAnswer: "すぐ断るより、先に理由を説明したほうがいいと思います。",
      source: "generated"
    },
    {
      prompt: "我觉得这个问题最好直接问店员。",
      modelAnswer: "この問題は店員さんに直接聞いたほうがいいと思います。",
      source: "generated"
    },
    {
      prompt: "如果对方已经不舒服了，我觉得不要继续追问比较好。",
      modelAnswer: "相手がもう困っているなら、それ以上聞かないほうがいいと思います。",
      source: "generated"
    }
  ],
  "muriga-aru": [
    {
      prompt: "今天之内全部做完有点不现实。",
      modelAnswer: "今日中に全部終わらせるには少し無理があります。",
      source: "generated"
    },
    {
      prompt: "只靠背句子就想会说日语有点不现实。",
      modelAnswer: "文を暗記するだけで日本語を話せるようになるには無理があります。",
      source: "generated"
    },
    {
      prompt: "第一次见面就让对方说很私人的事情，我觉得有点不合适。",
      modelAnswer: "初対面で相手にかなり個人的なことを話してもらうには少し無理があると思います。",
      source: "generated"
    }
  ],
  ichigainiienai: [
    {
      prompt: "不能一概说住在日本日语就会变好。",
      modelAnswer: "日本に住めば日本語が上手になるとは一概に言えません。",
      source: "generated"
    },
    {
      prompt: "不能一概说越礼貌越自然。",
      modelAnswer: "丁寧であればあるほど自然だとは一概に言えません。",
      source: "generated"
    },
    {
      prompt: "不能一概说错得少的人就更会交流。",
      modelAnswer: "間違いが少ない人のほうがコミュニケーションが上手だとは一概に言えません。",
      source: "generated"
    }
  ],
  "sekkaku-noni": [
    {
      prompt: "我特意来了这家店，结果已经卖完了。",
      modelAnswer: "せっかくこの店まで来たのに、もう売り切れていました。",
      source: "generated"
    },
    {
      prompt: "我特意准备了，结果对方突然取消了。",
      modelAnswer: "せっかく準備したのに、相手が急にキャンセルしました。",
      source: "generated"
    },
    {
      prompt: "我特意用日语说了，对方却马上换成了英语。",
      modelAnswer: "せっかく日本語で話したのに、相手はすぐ英語に切り替えてしまいました。",
      source: "generated"
    }
  ],
  toomottanoni: [
    {
      prompt: "我以为今天会比较空，没想到人很多。",
      modelAnswer: "今日は空いていると思ったのに、思ったより人が多いです。",
      source: "generated"
    },
    {
      prompt: "我以为很简单，结果比想象中难。",
      modelAnswer: "簡単だと思ったのに、思ったより難しかったです。",
      source: "generated"
    },
    {
      prompt: "我以为自己已经会说了，真正用的时候却说不出来。",
      modelAnswer: "もう話せると思ったのに、実際に使うと言葉が出てきませんでした。",
      source: "generated"
    }
  ],
  wakejanai: [
    {
      prompt: "我不是讨厌聚会，只是不太擅长和很多人聊天。",
      modelAnswer: "飲み会が嫌いなわけじゃないんですが、大人数で話すのが少し苦手です。",
      source: "generated"
    },
    {
      prompt: "我不是不想帮忙，只是今天时间有点不够。",
      modelAnswer: "手伝いたくないわけじゃないんですが、今日は少し時間が足りません。",
      source: "generated"
    },
    {
      prompt: "我不是觉得你的想法不好，只是现在执行起来有点难。",
      modelAnswer: "あなたの考えが悪いわけじゃないんですが、今すぐ実行するのは少し難しいです。",
      source: "generated"
    }
  ],
  temookashikunai: [
    {
      prompt: "这么忙的话，出一点失误也不奇怪。",
      modelAnswer: "これだけ忙しければ、少しミスが出てもおかしくないと思います。",
      source: "generated"
    },
    {
      prompt: "如果每天都睡不够，注意力下降也不奇怪。",
      modelAnswer: "毎日寝不足なら、集中力が下がってもおかしくないと思います。",
      source: "generated"
    },
    {
      prompt: "突然被那样说，生气也不奇怪。",
      modelAnswer: "急にあんなふうに言われたら、怒ってもおかしくないと思います。",
      source: "generated"
    }
  ],
  "nomomuriwa-nai": [
    {
      prompt: "被那样说的话，感到受伤也是可以理解的。",
      modelAnswer: "あんなふうに言われたら、傷つくのも無理はないと思います。",
      source: "generated"
    },
    {
      prompt: "第一次就说不出来，也是可以理解的。",
      modelAnswer: "初めてで言葉が出てこないのも無理はないと思います。",
      source: "generated"
    },
    {
      prompt: "一直被要求马上回答，感到压力大也是正常的。",
      modelAnswer: "ずっとすぐ答えるように求められたら、プレッシャーを感じるのも無理はないと思います。",
      source: "generated"
    }
  ],
  "とはかぎらない": [
    {
      prompt: "就算语法懂了，也不一定能说出口。",
      modelAnswer: "文法が分かっているからといって、話せるとは限りません。",
      source: "generated"
    },
    {
      prompt: "住在日本也不一定日语就会自然变好。",
      modelAnswer: "日本に住んでいるからといって、日本語が自然に上手になるとは限りません。",
      source: "generated"
    },
    {
      prompt: "对方说没关系，也不一定是真的不介意。",
      modelAnswer: "相手が大丈夫だと言ったからといって、本当に気にしていないとは限りません。",
      source: "generated"
    }
  ]
};

export const getCardPrompts = (pattern: TrainingPattern): CardPrompt[] =>
  pattern.cardPrompts?.length
    ? pattern.cardPrompts
    : generatedCardPromptSets[pattern.id] ?? [
        {
          prompt: pattern.cardPrompt,
          modelAnswer: pattern.modelAnswer,
          source: "generated"
        }
      ];
