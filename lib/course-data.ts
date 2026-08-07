export type CourseStage = {
  id: string;
  title: string;
  days: string;
  objective: string;
  content: string;
  passingStandard: string;
};

export type Scene = {
  id: number;
  title: string;
  track: "life" | "work";
  moduleTitle: string;
  mode: "情境流程化表达" | "情境结构化表达";
};

export type SentencePattern = {
  id: number;
  pattern: string;
  category: string;
  status: "catalog" | "refined";
};

export type RefinedPattern = SentencePattern & {
  meaning: string;
  usage: string;
  example: string;
  restaurantUse: string;
  commonMistake: string;
};

export type TrainingLevel = {
  id: "level-1" | "level-2" | "level-3";
  title: string;
  goal: string;
  task: string;
  prompt: string;
  hints: string[];
  targetPatternIds: number[];
  sampleAnswer: string;
  passCriteria: string[];
};

export type FeaturedCourse = {
  sceneId: number;
  title: string;
  audience: string;
  objective: string;
  focus: string[];
  targetPatternIds: number[];
  commonFailureModes: string[];
  trainingLevels: TrainingLevel[];
  reviewQuestions: string[];
  completionStandard: string;
};

export const philosophy = [
  "目标不是学得多，而是把日语训练到能在真实场景里本能说出来。",
  "通用 AI 只是工具；没有框架、纠偏和复盘的闲聊会巩固中式错误记忆。",
  "课程底座是高频句式和结构化表达，场景只是逼出表达能力的容器。",
  "训练要从中文拐杖开始，逐步过渡到提示互动，最后进入无提示实战。",
  "每日输入、输出、复盘、打卡和重复，负责把表达从知识变成肌肉记忆。"
];

export const stages: CourseStage[] = [
  {
    id: "stage-1",
    title: "破冰与生存期",
    days: "Day 1 - Day 30",
    objective: "克服开口恐惧，积累 30 个常用句式，掌握赴日生活/旅游痛点会话。",
    content: "30 个初级句式 + 15 个高频日常场景。",
    passingStandard: "不看提示，能应付 AI 店员、前台、路人等连续追问。"
  },
  {
    id: "stage-2",
    title: "人际交涉与高情商表达",
    days: "Day 31 - Day 75",
    objective: "习惯每天说日语，积累 45 个中级句式，处理日本生活中的复杂问题。",
    content: "45 个中级句式 + 15 个复杂人际场景。",
    passingStandard: "不看提示熟练应答，并能主动提出问题和交涉。"
  },
  {
    id: "stage-3",
    title: "逻辑重组与结构化输出",
    days: "Day 76 - Day 120",
    objective: "突破只会短句的瓶颈，掌握长段落结构化表达。",
    content: "45 个中级句式 + 22 篇结构化表达训练。",
    passingStandard: "能连续输出 4-6 句逻辑严密、衔接自然的日文。"
  },
  {
    id: "stage-4",
    title: "自由对话与灵活应用",
    days: "Day 121 - Day 150",
    objective: "完全脱离提示，在各类场景中自由切换并灵活表达。",
    content: "30 个中级句式 + 长篇视译挑战 + 场景与结构综合应用。",
    passingStandard: "能在无提示盲战中应对突发追问，并保持自然发音与表达。"
  }
];

export const scenes: Scene[] = [
  { id: 1, title: "クラスでの自己紹介", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 2, title: "コンビニでの支払い", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 3, title: "レストランでの注文", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 4, title: "道案内と乗り換え", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 5, title: "ホテルのチェックイン", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 6, title: "ドラッグストアでのショッピング", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 7, title: "郵便局/宅配便での荷物発送", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 8, title: "美容室の予約", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 9, title: "空港でのチェックインと入国審査", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 10, title: "飲食店の電話予約", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 11, title: "催促", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 12, title: "注文間違いの指摘と交換", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 13, title: "誘いを受ける", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 14, title: "誘いを断る", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 15, title: "旅行の計画を立てる", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 16, title: "噂話と情報", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 17, title: "プレゼントを買う", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 18, title: "許可を求める", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 19, title: "返品と交換", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 20, title: "助言と忠告", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 21, title: "シフトの交代依頼", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 22, title: "病院での受診", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 23, title: "共感と慰め", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 24, title: "部屋探し", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 25, title: "役所での手続き", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 26, title: "修理依頼", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 27, title: "近隣トラブルの相談", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 28, title: "落とし物届出", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 29, title: "返却をお願いする", track: "life", moduleTitle: "日本で暮らす", mode: "情境流程化表达" },
  { id: 30, title: "交流会でのアイスブレイク", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 31, title: "面接での自己PR", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 32, title: "謝罪する", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 33, title: "遅刻", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 34, title: "仕事のミス報告", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 35, title: "有給休暇の申請", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 36, title: "職場での電話応対", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 37, title: "確認を依頼する", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 38, title: "仕事を断る", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 39, title: "お土産を渡す", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 40, title: "感想を述べる", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 41, title: "不満を言う", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 42, title: "飲み会での乾杯の挨拶", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 43, title: "飲み会の途中で帰る", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 44, title: "ミスの指摘と修正依頼", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 45, title: "予定の変更", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 46, title: "欠勤連絡", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 47, title: "賛成と反対", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 48, title: "依頼する", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 49, title: "手伝う", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 50, title: "感謝とお礼", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 51, title: "別れと見送り", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" },
  { id: 52, title: "久しぶりの再会", track: "work", moduleTitle: "日本で働く", mode: "情境结构化表达" }
];

const catalogPatterns: Omit<SentencePattern, "category" | "status">[] = [
  { id: 1, pattern: "～たらどうするんだ" },
  { id: 2, pattern: "～とは限らない" },
  { id: 3, pattern: "～気はさらさらない" },
  { id: 4, pattern: "～数だけ" },
  { id: 5, pattern: "～立場じゃない" },
  { id: 6, pattern: "～ことはない" },
  { id: 7, pattern: "～たことがある・ない" },
  { id: 8, pattern: "～ば～ほど" },
  { id: 9, pattern: "～べきだった" },
  { id: 10, pattern: "～とは言い切れない" },
  { id: 11, pattern: "～気がする" },
  { id: 12, pattern: "ずっと～たかった" },
  { id: 13, pattern: "予想以上に" },
  { id: 14, pattern: "～てほしい" },
  { id: 15, pattern: "～ところがある" },
  { id: 16, pattern: "～扱いする・扱いされる" },
  { id: 17, pattern: "～てくれてありがとう" },
  { id: 18, pattern: "～てすみません" },
  { id: 19, pattern: "なぜかと言うと～からだ" },
  { id: 20, pattern: "～さえ～ば" },
  { id: 21, pattern: "～するつもりです" },
  { id: 22, pattern: "～ば大丈夫" },
  { id: 23, pattern: "ただ～だけ" },
  { id: 24, pattern: "～て損した" },
  { id: 25, pattern: "～てくれませんか" },
  { id: 26, pattern: "どうしても～たい" },
  { id: 27, pattern: "なんで～んですか" },
  { id: 28, pattern: "～てもらえませんか" },
  { id: 29, pattern: "これといって～ない" },
  { id: 30, pattern: "～たびに" },
  { id: 31, pattern: "～つもりはない" },
  { id: 32, pattern: "～からには" },
  { id: 33, pattern: "～たら～てください" },
  { id: 34, pattern: "～かどうか分からない" },
  { id: 35, pattern: "～うちに" },
  { id: 36, pattern: "～とは思わなかった" },
  { id: 37, pattern: "～のは～である" },
  { id: 38, pattern: "～気分じゃない" },
  { id: 39, pattern: "～と思ってたのに、～と思ったのに" },
  { id: 40, pattern: "～ほうがいい" },
  { id: 41, pattern: "二度と～ない" },
  { id: 42, pattern: "～なら話は別だ" },
  { id: 43, pattern: "思ってるほど～じゃない" },
  { id: 44, pattern: "だんだん～てきた" },
  { id: 45, pattern: "～ないように" },
  { id: 46, pattern: "～うちに（は）入らない" },
  { id: 47, pattern: "～というか なんというか" },
  { id: 48, pattern: "（ちょうど）～ようと思っていたところだ" },
  { id: 49, pattern: "～なんて信じられない" },
  { id: 50, pattern: "っぽい" },
  { id: 51, pattern: "～て以来・名詞＋以来" },
  { id: 52, pattern: "どちらかと言うと、どちらかと言えば～" },
  { id: 53, pattern: "～つもりだったが" },
  { id: 54, pattern: "～まで、残すところあと～" },
  { id: 55, pattern: "～場合じゃない" },
  { id: 56, pattern: "～ば～はずだ" },
  { id: 57, pattern: "生まれて初めて～" },
  { id: 58, pattern: "～ても始まらない" },
  { id: 59, pattern: "なんで～んだろう" },
  { id: 60, pattern: "いつもより～" },
  { id: 61, pattern: "だれが～って" },
  { id: 62, pattern: "～ばよかったのに" },
  { id: 63, pattern: "～には無理がある" },
  { id: 64, pattern: "どれだけ～か分かる？" },
  { id: 65, pattern: "～まま" },
  { id: 66, pattern: "～ない限り" },
  { id: 67, pattern: "ただ～あるのみだ" },
  { id: 68, pattern: "～たとしても" },
  { id: 69, pattern: "～につながる" },
  { id: 70, pattern: "～ながら" },
  { id: 71, pattern: "～ようとする" },
  { id: 72, pattern: "～のも無理はない" },
  { id: 73, pattern: "～てみせる" },
  { id: 74, pattern: "～匂いがする" },
  { id: 75, pattern: "～かと思ったら～だった" },
  { id: 76, pattern: "～ずにすむ" },
  { id: 77, pattern: "～覚えはない" },
  { id: 78, pattern: "～にうるさい" },
  { id: 79, pattern: "～（する）気ですか" },
  { id: 80, pattern: "～てもおかしく(は)ない" },
  { id: 81, pattern: "～すぎる" },
  { id: 82, pattern: "～はずなのに" },
  { id: 83, pattern: "～のを忘れた" },
  { id: 84, pattern: "～はずがない" },
  { id: 85, pattern: "～ばよかった" },
  { id: 86, pattern: "～てもらわないと" },
  { id: 87, pattern: "～に決まっている" },
  { id: 88, pattern: "～ように見える" },
  { id: 89, pattern: "～かと思ってた" },
  { id: 90, pattern: "～なかったことにする" },
  { id: 91, pattern: "～ていうより" },
  { id: 92, pattern: "～たまらない" },
  { id: 93, pattern: "どうりで～わけだ" },
  { id: 94, pattern: "せっかく～のに" },
  { id: 95, pattern: "今にも～そう" },
  { id: 96, pattern: "～って言ったのに" },
  { id: 97, pattern: "～わけない" },
  { id: 98, pattern: "危うく～ところだった" },
  { id: 99, pattern: "～以外の何物でもない" },
  { id: 100, pattern: "活用：～は～です" },
  { id: 101, pattern: "～かいがあった" },
  { id: 102, pattern: "～ようになる" },
  { id: 103, pattern: "～ふりをする" },
  { id: 104, pattern: "～にもほどがある" },
  { id: 105, pattern: "誰に～するように頼まれた" },
  { id: 106, pattern: "下手したら～" },
  { id: 107, pattern: "ろくに～ない" },
  { id: 108, pattern: "～顔をしている" },
  { id: 109, pattern: "～といっても過言ではない" },
  { id: 110, pattern: "V(辞) + しかない" },
  { id: 111, pattern: "～に恵まれる" },
  { id: 112, pattern: "～ついでに" },
  { id: 113, pattern: "～明け" },
  { id: 114, pattern: "～きる・きれない" },
  { id: 115, pattern: "～どころじゃない" },
  { id: 116, pattern: "名詞+しかない" },
  { id: 117, pattern: "っけ" },
  { id: 118, pattern: "てっきり～と思ってた" },
  { id: 119, pattern: "～ために（も）" },
  { id: 120, pattern: "～たくて～わけじゃない" },
  { id: 121, pattern: "思ったより～" },
  { id: 122, pattern: "そんなに～なくても" },
  { id: 123, pattern: "～たつもりで" },
  { id: 124, pattern: "～ば・たらきりがない" },
  { id: 125, pattern: "いつまで～んですか" },
  { id: 126, pattern: "～てたまるか" },
  { id: 127, pattern: "～に限る" },
  { id: 128, pattern: "名詞＋ばかり" },
  { id: 129, pattern: "～のは・もほどほどに" },
  { id: 130, pattern: "そろそろ～ないと" },
  { id: 131, pattern: "なんでそんなに～（の・んだ）" },
  { id: 132, pattern: "～くせに" },
  { id: 133, pattern: "好きで～わけじゃない" },
  { id: 134, pattern: "～もいれば～もいる" },
  { id: 135, pattern: "いくら～ても(でも)" },
  { id: 136, pattern: "～は～によって違います" },
  { id: 137, pattern: "～わけにはいかない" },
  { id: 138, pattern: "～にとって（は・も）" },
  { id: 139, pattern: "さほど～ない" },
  { id: 140, pattern: "～としか言いようがない" },
  { id: 141, pattern: "未だに～ない" },
  { id: 142, pattern: "～には～がある" },
  { id: 143, pattern: "これだけは～てほしい" },
  { id: 144, pattern: "～たいんですが" },
  { id: 145, pattern: "形、色、声、目、髪 を している" },
  { id: 146, pattern: "～てもいいですか" },
  { id: 147, pattern: "～と～、どっちがいい？" },
  { id: 148, pattern: "～ていただけませんか" },
  { id: 149, pattern: "～あるんですけど・あるんだけど" },
  { id: 150, pattern: "～たいと思っています" }
];

const categoryById = (id: number) => {
  if ([14, 25, 28, 143, 144, 146, 148, 149, 150].includes(id)) return "请求与愿望";
  if ([18, 32, 39, 62, 85, 94, 96].includes(id)) return "道歉与遗憾";
  if ([19, 34, 37, 69, 72, 93, 136, 138, 142].includes(id)) return "说明与因果";
  if ([2, 10, 31, 45, 55, 63, 66, 77, 84, 97, 107, 137, 139].includes(id)) return "否定与限制";
  if ([11, 36, 38, 48, 49, 52, 59, 74, 88, 89, 95, 117, 118, 121].includes(id)) return "感受与判断";
  if ([33, 35, 56, 68, 75, 80, 98, 106, 124, 135].includes(id)) return "条件与假设";
  if ([1, 27, 61, 64, 79, 105, 125, 131, 140, 147].includes(id)) return "追问与反应";
  if ([8, 30, 44, 51, 57, 60, 65, 70, 71, 76, 81, 82, 83, 86, 87, 90, 91, 92, 101, 102, 103, 104, 108, 109, 111, 112, 113, 114, 115, 119, 120, 122, 123, 126, 127, 128, 129, 130, 132, 133, 134, 141, 145].includes(id)) return "状态与描写";
  return "基础结构";
};

export const sentencePatterns: SentencePattern[] = catalogPatterns.map((item) => ({
  ...item,
  category: categoryById(item.id),
  status: [14, 25, 28, 34, 55, 138, 143, 144, 146, 148, 149, 150].includes(item.id)
    ? "refined"
    : "catalog"
}));

export const refinedPatterns: RefinedPattern[] = [
  {
    id: 14,
    pattern: "～てほしい",
    category: "请求与愿望",
    status: "refined",
    meaning: "希望对方或第三方做某事，直接度较高。",
    usage: "适合表达明确需求；对店员说时要配合缓冲表达，避免太硬。",
    example: "できれば、ネギは入れないでほしいです。",
    restaurantUse: "表达忌口或强偏好，例如不放葱、少冰、不要辣。",
    commonMistake: "直接说「水を少なくしてほしい」会偏生硬，服务场景更自然的是「少なめにしていただけますか」。"
  },
  {
    id: 25,
    pattern: "～てくれませんか",
    category: "请求与愿望",
    status: "refined",
    meaning: "请求对方为自己做某事。",
    usage: "日常可用，但对店员或陌生人略直接；可作为基础请求句。",
    example: "お水を持ってきてくれませんか。",
    restaurantUse: "请店员拿水、菜单、餐具。",
    commonMistake: "在正式服务场景里长期只用くれませんか，礼貌度不如いただけませんか。"
  },
  {
    id: 28,
    pattern: "～てもらえませんか",
    category: "请求与愿望",
    status: "refined",
    meaning: "请求对方帮自己完成动作，比命令柔和。",
    usage: "适合对店员提出具体操作。",
    example: "氷を少なめにしてもらえませんか。",
    restaurantUse: "少冰、换座、打包、分开放调料。",
    commonMistake: "把动作对象说反，例如「私がしてもらえませんか」结构不成立。"
  },
  {
    id: 34,
    pattern: "～かどうか分からない",
    category: "说明与因果",
    status: "refined",
    meaning: "表示不确定是否如此。",
    usage: "适合先确认菜单、食材、服务是否可行。",
    example: "この料理に卵が入っているかどうか分からないんですが。",
    restaurantUse: "询问过敏源、是否含酒精、是否能换配菜。",
    commonMistake: "只说「卵ありますか」可能含糊，不如明确「卵が入っていますか」。"
  },
  {
    id: 55,
    pattern: "～場合じゃない",
    category: "否定与限制",
    status: "refined",
    meaning: "不是做某事的时候；眼下有更重要限制。",
    usage: "口语中表达当前不适合某选择。",
    example: "今日は急いでいるので、ゆっくり食べている場合じゃないんです。",
    restaurantUse: "解释赶时间，选择打包或快速结账。",
    commonMistake: "在服务请求中不要过度使用，容易显得情绪强。"
  },
  {
    id: 138,
    pattern: "～にとって（は・も）",
    category: "说明与因果",
    status: "refined",
    meaning: "对某人或某群体来说。",
    usage: "适合解释个人限制、偏好或过敏原因。",
    example: "私にとって、辛すぎる料理は少し食べにくいです。",
    restaurantUse: "说明为什么需要调整口味或食材。",
    commonMistake: "不要把它和「について」混用；にとって强调评价立场。"
  },
  {
    id: 143,
    pattern: "これだけは～てほしい",
    category: "请求与愿望",
    status: "refined",
    meaning: "唯独这一点希望对方务必做到。",
    usage: "用于强调底线或特别重要的要求。",
    example: "これだけは確認してほしいんですが、ナッツは入っていませんか。",
    restaurantUse: "过敏、宗教饮食、不能吃的食材。",
    commonMistake: "对店员使用时要加「すみません」和「んですが」缓冲。"
  },
  {
    id: 144,
    pattern: "～たいんですが",
    category: "请求与愿望",
    status: "refined",
    meaning: "想做某事，但把请求留给对方接住。",
    usage: "日本服务场景里非常自然的委婉开口。",
    example: "注文したいんですが、よろしいですか。",
    restaurantUse: "开始点餐、想换座、想打包、想结账。",
    commonMistake: "只说「注文したいです」也能懂，但不如「注文したいんですが」自然。"
  },
  {
    id: 146,
    pattern: "～てもいいですか",
    category: "请求与愿望",
    status: "refined",
    meaning: "请求许可，询问自己能不能做某事。",
    usage: "适合确认是否可以换座、拍照、打包。",
    example: "この席に移ってもいいですか。",
    restaurantUse: "换座、使用插座、打包剩菜。",
    commonMistake: "请求对方做事时不要用这个句型；那时应用「～ていただけませんか」。"
  },
  {
    id: 148,
    pattern: "～ていただけませんか",
    category: "请求与愿望",
    status: "refined",
    meaning: "礼貌地请求对方为自己做某事。",
    usage: "服务场景首选的礼貌请求结构。",
    example: "ドレッシングを別にしていただけませんか。",
    restaurantUse: "少冰、去葱、分开放调料、换座、打包。",
    commonMistake: "「いただきませんか」不是请求对方帮忙的表达，要用可能形「いただけませんか」。"
  },
  {
    id: 149,
    pattern: "～あるんですけど・あるんだけど",
    category: "请求与愿望",
    status: "refined",
    meaning: "先抛出背景或问题，让对方自然接话。",
    usage: "适合引出请求、说明困难、开启交涉。",
    example: "ナッツアレルギーがあるんですけど、この料理は大丈夫ですか。",
    restaurantUse: "说明过敏、赶时间、预约、人数变化。",
    commonMistake: "只说背景不说请求会让对方难以判断下一步，要补一句「確認していただけますか」。"
  },
  {
    id: 150,
    pattern: "～たいと思っています",
    category: "请求与愿望",
    status: "refined",
    meaning: "较正式地表达自己的意向。",
    usage: "比たいです更柔和，适合说明计划或选择。",
    example: "今日は軽めのものを注文したいと思っています。",
    restaurantUse: "询问推荐、说明想吃清淡/不辣/份量小的选择。",
    commonMistake: "临场短请求不必每句都用，太长会拖慢对话。"
  }
];

export const featuredCourse: FeaturedCourse = {
  sceneId: 3,
  title: "レストランでの注文：特殊要求 + 店员追问应答",
  audience: "N3-N1 之间，读得懂但餐厅真实对话容易卡住的中文母语学习者。",
  objective: "把点餐、特殊要求、忌口说明和店员追问练成可即时调用的表达。",
  focus: [
    "用委婉结构开口，而不是直译中文命令",
    "说明过敏、忌口、赶时间等背景",
    "面对追问时继续推进对话，不只回答はい/いいえ",
    "把目标句式从造句迁移到真实回合"
  ],
  targetPatternIds: [14, 25, 28, 34, 55, 138, 143, 144, 146, 148, 149, 150],
  commonFailureModes: [
    "只会说単語或菜单名，不能完整表达需求",
    "把中文请求直译成命令式，礼貌度不足",
    "不知道如何解释忌口和过敏原因",
    "被店员追问后无法继续组织句子"
  ],
  trainingLevels: [
    {
      id: "level-1",
      title: "レベルⅠ：视译造句",
      goal: "看中文提示，用指定句式组织自然日语。",
      task: "把中文需求变成日语，不追求长，先追求结构正确。",
      prompt: "你在餐厅点饮料，想请店员少放冰。请用礼貌请求表达。",
      hints: ["目标句式：～ていただけませんか", "关键词：氷、少なめ", "先加缓冲：すみません"],
      targetPatternIds: [148, 144],
      sampleAnswer: "すみません、氷を少なめにしていただけませんか。",
      passCriteria: ["用了礼貌请求结构", "需求对象清楚", "没有中文直译腔"]
    },
    {
      id: "level-2",
      title: "レベルⅡ：提示互动",
      goal: "在店员追问中变形使用句式。",
      task: "店员继续确认你的忌口，你要说明原因并提出可执行请求。",
      prompt: "店员问：辛さは普通でよろしいですか。你不太能吃辣，想请对方做成微辣。",
      hints: ["可用：私にとって～", "可用：～てもらえませんか", "把理由和请求分开说"],
      targetPatternIds: [28, 138],
      sampleAnswer: "私にとって普通の辛さは少し強いので、辛さを控えめにしてもらえませんか。",
      passCriteria: ["先解释个人限制", "请求具体可执行", "能接住店员追问"]
    },
    {
      id: "level-3",
      title: "レベルⅢ：生存盲战",
      goal: "无提示完成 4-6 回合点餐交涉。",
      task: "你要点餐、说明过敏、确认食材、请求打包，并自然回应店员追问。",
      prompt: "进入餐厅。AI 扮演店员，你要完成点餐并处理特殊要求。不要看提示，直接用日语开始。",
      hints: ["开头可以用：注文したいんですが", "过敏可用：～があるんですけど", "请求可用：～ていただけませんか"],
      targetPatternIds: [34, 143, 144, 146, 148, 149, 150],
      sampleAnswer: "すみません、注文したいんですが。ナッツアレルギーがあるんですけど、このサラダにナッツが入っているかどうか確認していただけませんか。",
      passCriteria: ["能主动开启对话", "能说明背景和请求", "能连续推进多个回合", "至少自然使用 2 个目标句式"]
    }
  ],
  reviewQuestions: [
    "今天哪个句式最容易卡住？",
    "你的请求听起来像命令，还是像礼貌协商？",
    "遇到追问时，你有没有补充理由，而不是只说はい/いいえ？",
    "下一轮你要强制复用哪两个句式？"
  ],
  completionStandard: "完成三阶任务各 1 次，提交至少 1 条语音打卡占位，并在 AI 反馈中达到自然度与礼貌度均 7 分以上。"
};

export const dailySop = [
  { title: "句式输入与造句", minutes: "15 分钟", action: "学习 1 个核心句式，完成 1 个对应表达。" },
  { title: "AI 闯关练兵", minutes: "40 分钟", action: "依次完成视译、提示互动、无提示自主互动。" },
  { title: "复盘与刷进度", minutes: "5 分钟", action: "回看 AI 纠错，记录盲区，并累计练习次数。" },
  { title: "语音打卡", minutes: "24 小时内", action: "练熟后提交对应情境的语音打卡，本 MVP 先记录完成状态。" }
];

export const liveTopics = [
  "自分らしく生きる",
  "有馬君への手紙",
  "能力試験について",
  "行きたいところ",
  "日本語の勉強法",
  "そんな気分じゃない",
  "お昼時間に同僚との雑談",
  "久しぶりに再会した同級生",
  "日記",
  "ふざけるな！",
  "スピーチ",
  "家出",
  "大雑把な彼女",
  "告白",
  "水泳",
  "先に行ってて",
  "幸せ",
  "喋れるようになった",
  "嘘をつくにもほどがある",
  "心強い言葉ありがとうございます",
  "いつもより早いね",
  "今度だけは許して",
  "帰らなければよかった",
  "同期の男同士",
  "そろそろ出発しないと",
  "実る季節は人によって違う",
  "試着してもいいですか",
  "先輩、お願いがあるんですけど"
];
