import { sentencePatterns } from "@/lib/course-data";

export type LessonPhase = "review" | "patterns" | "scene" | "summary" | "complete";
export type StoryBeat = "transaction" | "change" | "personal" | "closing";

export type CourseDay = {
  day: number;
  chapter: number;
  title: string;
  subtitle: string;
  role: string;
  goal: string;
  opening: string;
  patternIds: number[];
  translationPrompts: Record<number, { prompt: string; answer: string; hint: string }>;
  events: Record<StoryBeat, string>;
};

export type CourseChapter = {
  id: number;
  title: string;
  description: string;
  days: number[];
  available: boolean;
};

export const restaurantDays: CourseDay[] = [
  {
    day: 1,
    chapter: 1,
    title: "入店与点餐",
    subtitle: "把愿望说清楚，再礼貌确认",
    role: "常去餐厅的店员・佐藤さん",
    goal: "完成入店、选择座位和点餐，并主动补充一个偏好。",
    opening: "いらっしゃいませ。何名様でしょうか。",
    patternIds: [144, 148, 149],
    translationPrompts: {
      144: {
        prompt: "我想坐靠窗的位置，请问还有空位吗？",
        answer: "窓側の席に座りたいんですが、空いていますか。",
        hint: "窓側の席に＿＿んですが、＿＿ますか。"
      },
      148: {
        prompt: "不好意思，可以把冰少放一点吗？",
        answer: "すみません、氷を少なめにしていただけませんか。",
        hint: "すみません、氷を＿＿にしていただけませんか。"
      },
      149: {
        prompt: "我有坚果过敏，想确认这道菜里有没有坚果。",
        answer: "ナッツのアレルギーがあるんですけど、この料理に入っていますか。",
        hint: "＿＿があるんですけど、この料理に＿＿ますか。"
      }
    },
    events: {
      transaction: "确认人数、座位和第一份订单",
      change: "用户想要的饮料只剩另一种尺寸，需要做选择",
      personal: "从饮食偏好聊到平时是否经常在外面吃饭",
      closing: "确认订单，并请用户主动问一个问题"
    }
  },
  {
    day: 2,
    chapter: 1,
    title: "口味与忌口",
    subtitle: "说明限制，也给出原因",
    role: "餐厅店员・佐藤さん",
    goal: "说明口味、过敏或忌口，并确认可替换的选项。",
    opening: "今日のおすすめは海老のクリームパスタです。いかがですか。",
    patternIds: [14, 146, 34],
    translationPrompts: {
      14: {
        prompt: "如果可以的话，我希望不要放葱。",
        answer: "できれば、ねぎは入れないでほしいです。",
        hint: "できれば、＿＿は入れないでほしいです。"
      },
      146: {
        prompt: "我可以把酱汁换成另外一种吗？",
        answer: "ソースを別のものに変えてもいいですか。",
        hint: "＿＿を別のものに変えてもいいですか。"
      },
      34: {
        prompt: "我不知道这里面有没有乳制品。",
        answer: "これに乳製品が入っているかどうか分かりません。",
        hint: "これに＿＿が入っているかどうか分かりません。"
      }
    },
    events: {
      transaction: "听取推荐并说明自己的限制",
      change: "推荐菜无法完全去除某种食材，需要换菜",
      personal: "聊平时喜欢的口味以及形成这种偏好的原因",
      closing: "确认替代方案，并复述最终选择"
    }
  },
  {
    day: 3,
    chapter: 1,
    title: "追加与催单",
    subtitle: "提出请求，不让语气变硬",
    role: "餐厅店员・佐藤さん",
    goal: "追加餐点、确认等待时间，并礼貌提醒尚未上桌的菜。",
    opening: "お料理はいかがですか。追加のご注文はございますか。",
    patternIds: [28, 25, 19],
    translationPrompts: {
      28: {
        prompt: "不好意思，可以再给我一套餐具吗？",
        answer: "すみません、取り皿をもう一つ持ってきてもらえませんか。",
        hint: "すみません、＿＿をもう一つ持ってきてもらえませんか。"
      },
      25: {
        prompt: "可以帮我确认一下这道菜还要等多久吗？",
        answer: "この料理があとどのくらいかかるか、確認してくれませんか。",
        hint: "＿＿か、確認してくれませんか。"
      },
      19: {
        prompt: "我想先吃热菜，因为凉了以后味道会变。",
        answer: "温かい料理を先に食べたいです。なぜかというと、冷めると味が変わるからです。",
        hint: "＿＿たいです。なぜかというと、＿＿からです。"
      }
    },
    events: {
      transaction: "追加一份餐点或餐具",
      change: "一道菜等待时间比预计更长",
      personal: "聊用户吃饭时在意的顺序和习惯",
      closing: "确认是否继续等待，并提出替代方案"
    }
  },
  {
    day: 4,
    chapter: 1,
    title: "差错与完整交流",
    subtitle: "处理问题，再把话题聊深",
    role: "餐厅店员・佐藤さん",
    goal: "处理上错菜或结账问题，并完成一次包含理由和感受的连续表达。",
    opening: "お待たせいたしました。こちら、辛口のカレーでございます。",
    patternIds: [94, 39, 121],
    translationPrompts: {
      94: {
        prompt: "我特意点了不辣的，结果送来的是辣的。",
        answer: "せっかく辛くないものを頼んだのに、辛口の料理が来ました。",
        hint: "せっかく＿＿たのに、＿＿が来ました。"
      },
      39: {
        prompt: "我以为已经改过订单了，没想到还是原来的内容。",
        answer: "注文を変更してもらったと思ったのに、まだ元の内容のままでした。",
        hint: "＿＿と思ったのに、＿＿ままでした。"
      },
      121: {
        prompt: "这道菜比我想象中辣，不过味道很好。",
        answer: "この料理は思ったより辛いですが、味はとてもおいしいです。",
        hint: "この料理は思ったより＿＿ですが、＿＿です。"
      }
    },
    events: {
      transaction: "指出上错的菜并说明正确订单",
      change: "店员提出重做或更换，等待时间不同",
      personal: "聊一次印象深刻的消费经历及当时感受",
      closing: "协商最终处理方式并自然结束对话"
    }
  }
];

const plannedChapterTitles = [
  ["便利店与超市", "询问商品、结账与处理缺货"],
  ["购物与退换", "比较选择、说明问题与协商处理"],
  ["交通与问路", "确认路线、应对延误与求助"],
  ["预约与办事", "电话预约、变更时间与确认条件"],
  ["医院与药店", "描述症状、理解说明与表达顾虑"],
  ["居家与邻里", "生活问题、请求帮助与日常寒暄"],
  ["职场交流", "汇报、协商、拒绝与提出意见"],
  ["朋友邀约", "邀请、婉拒、替代方案与关系维护"],
  ["兴趣与周末", "从事实扩展到经历、理由和感受"],
  ["旅行与住宿", "办理入住、提出要求与处理意外"],
  ["个人经历", "讲清事件经过、变化和真实感受"],
  ["比较与选择", "陈述偏好、权衡条件与解释理由"],
  ["观点讨论", "表达立场、例外、反驳与保留"],
  ["综合应用", "跨场景自由交流与最终复盘"]
] as const;

export const courseChapters: CourseChapter[] = [
  {
    id: 1,
    title: "餐厅里的连续交流",
    description: "从点餐到处理差错，再从事务进入闲聊。",
    days: [1, 2, 3, 4],
    available: true
  },
  ...plannedChapterTitles.map(([title, description], index) => ({
    id: index + 2,
    title,
    description,
    days: Array.from({ length: 4 }, (_, day) => (index + 1) * 4 + day + 1),
    available: false
  }))
];

export const getCourseDay = (day: number) => restaurantDays.find((item) => item.day === day) ?? restaurantDays[0];

export const getStoryBeat = (turn: number): StoryBeat => {
  if (turn < 2) return "transaction";
  if (turn < 4) return "change";
  if (turn < 7) return "personal";
  return "closing";
};

export const getPatternLabel = (id: number) => sentencePatterns.find((pattern) => pattern.id === id)?.pattern ?? `句式 ${id}`;

