import { sentencePatterns } from "@/lib/course-data";
import { trainingPatterns } from "@/lib/training-system";

export type PatternLearningStatus = "new" | "learning" | "review" | "mastered";

export type PatternRecord = {
  status: PatternLearningStatus;
  attempts: number;
  failures: number;
  hintsUsed: number;
  successfulAttempts: Array<{ date: string; inScene: boolean; hintLevel: number }>;
  successfulDates: string[];
  sceneSuccessDates: string[];
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
};

export type LearnerMemory = {
  id: string;
  category: "preference" | "habit" | "experience" | "opinion" | "goal";
  text: string;
  createdAt: string;
};

export type CourseMessage = {
  id: string;
  role: "ai" | "user" | "coach" | "system";
  text: string;
  detail?: string;
  rewrite?: string;
};

export type LessonSession = {
  day: number;
  date: string;
  phase: "review" | "patterns" | "scene" | "summary" | "complete";
  reviewPatternIds: number[];
  reviewIndex: number;
  patternIndex: number;
  attempt: number;
  hintLevel: number;
  messages: CourseMessage[];
  turn: number;
  usedPatternIds: number[];
  expressionDimensions: string[];
  coachNotes: string[];
  completedAt: string | null;
  updatedAt: string;
};

export type LearningState = {
  version: 2;
  currentDay: number;
  patternRecords: Record<number, PatternRecord>;
  sessions: Record<string, LessonSession>;
  memories: LearnerMemory[];
  settings: {
    autoplay: boolean;
    playbackRate: 0.8 | 1;
  };
  lastActiveDate: string | null;
  streak: number;
};

export const LEARNING_STATE_KEY = "japanese-output-learning-state-v2";
export const LEGACY_PROGRESS_KEY = "forced-output-training-progress-v1";

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyPatternRecord = (): PatternRecord => ({
  status: "new",
  attempts: 0,
  failures: 0,
  hintsUsed: 0,
  successfulAttempts: [],
  successfulDates: [],
  sceneSuccessDates: [],
  lastPracticedAt: null,
  nextReviewAt: null
});

export const createLearningState = (): LearningState => ({
  version: 2,
  currentDay: 1,
  patternRecords: Object.fromEntries(sentencePatterns.map((pattern) => [pattern.id, emptyPatternRecord()])),
  sessions: {},
  memories: [],
  settings: { autoplay: true, playbackRate: 1 },
  lastActiveDate: null,
  streak: 0
});

const normalizedPattern = (value: string) =>
  value.replace(/[～〜~・（）()\s]/g, "").replace(/と言う/g, "という").toLowerCase();

const migrateLegacyState = (stored: unknown): LearningState => {
  const state = createLearningState();
  if (!stored || typeof stored !== "object") return state;
  const legacy = stored as Record<string, { status?: string; cardPasses?: number; scenePasses?: number; failures?: number }>;
  const catalogByPattern = new Map(sentencePatterns.map((item) => [normalizedPattern(item.pattern), item.id]));

  for (const oldPattern of trainingPatterns) {
    const oldRecord = legacy[oldPattern.id];
    if (!oldRecord || oldRecord.status === "new") continue;
    const exactId = catalogByPattern.get(normalizedPattern(oldPattern.pattern));
    const fuzzyId = exactId ?? sentencePatterns.find((item) => {
      const current = normalizedPattern(item.pattern);
      const previous = normalizedPattern(oldPattern.pattern);
      return current.includes(previous) || previous.includes(current);
    })?.id;
    if (!fuzzyId) continue;
    state.patternRecords[fuzzyId] = {
      ...state.patternRecords[fuzzyId],
      status: oldRecord.status === "seen" ? "learning" : "review",
      attempts: (oldRecord.cardPasses ?? 0) + (oldRecord.scenePasses ?? 0) + (oldRecord.failures ?? 0),
      failures: oldRecord.failures ?? 0,
      nextReviewAt: localDateKey()
    };
  }
  return state;
};

const validStatus = (value: unknown): value is PatternLearningStatus =>
  value === "new" || value === "learning" || value === "review" || value === "mastered";

const stringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const mergeLearningState = (stored: unknown): LearningState => {
  const base = createLearningState();
  if (!stored || typeof stored !== "object") return base;
  const incoming = stored as Partial<LearningState>;

  if (incoming.patternRecords && typeof incoming.patternRecords === "object") {
    for (const pattern of sentencePatterns) {
      const record = incoming.patternRecords[pattern.id];
      if (!record || typeof record !== "object") continue;
      base.patternRecords[pattern.id] = {
        status: validStatus(record.status) ? record.status : "new",
        attempts: Number.isFinite(record.attempts) ? Number(record.attempts) : 0,
        failures: Number.isFinite(record.failures) ? Number(record.failures) : 0,
        hintsUsed: Number.isFinite(record.hintsUsed) ? Number(record.hintsUsed) : 0,
        successfulAttempts: Array.isArray(record.successfulAttempts)
          ? record.successfulAttempts.filter(
              (item): item is PatternRecord["successfulAttempts"][number] =>
                Boolean(item) && typeof item.date === "string" && typeof item.inScene === "boolean" && Number.isFinite(item.hintLevel)
            )
          : [],
        successfulDates: stringArray(record.successfulDates),
        sceneSuccessDates: stringArray(record.sceneSuccessDates),
        lastPracticedAt: typeof record.lastPracticedAt === "string" ? record.lastPracticedAt : null,
        nextReviewAt: typeof record.nextReviewAt === "string" ? record.nextReviewAt : null
      };
    }
  }

  base.currentDay = Number.isInteger(incoming.currentDay)
    ? Math.max(1, Math.min(60, Number(incoming.currentDay)))
    : 1;
  base.sessions = incoming.sessions && typeof incoming.sessions === "object" ? incoming.sessions : {};
  base.memories = Array.isArray(incoming.memories)
    ? incoming.memories.filter(
        (item): item is LearnerMemory =>
          Boolean(item) && typeof item.id === "string" && typeof item.text === "string" && typeof item.createdAt === "string"
      )
    : [];
  base.settings = {
    autoplay: incoming.settings?.autoplay !== false,
    playbackRate: incoming.settings?.playbackRate === 0.8 ? 0.8 : 1
  };
  base.lastActiveDate = typeof incoming.lastActiveDate === "string" ? incoming.lastActiveDate : null;
  base.streak = Number.isFinite(incoming.streak) ? Math.max(0, Number(incoming.streak)) : 0;
  return base;
};

const addDays = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
};

const uniqueDates = (dates: string[], next: string) => Array.from(new Set([...dates, next])).sort();

export const recordPatternAttempt = (
  state: LearningState,
  patternId: number,
  result: { success: boolean; inScene: boolean; hintLevel: number; date?: string }
): LearningState => {
  const date = result.date ?? localDateKey();
  const current = state.patternRecords[patternId] ?? emptyPatternRecord();
  const successfulDates = result.success ? uniqueDates(current.successfulDates, date) : current.successfulDates;
  const sceneSuccessDates = result.success && result.inScene
    ? uniqueDates(current.sceneSuccessDates, date)
    : current.sceneSuccessDates;
  const successfulAttempts = result.success
    ? [...current.successfulAttempts, { date, inScene: result.inScene, hintLevel: result.hintLevel }]
    : current.successfulAttempts;
  const firstSuccess = successfulDates[0];
  const spanDays = firstSuccess
    ? Math.floor((new Date(`${date}T12:00:00`).getTime() - new Date(`${firstSuccess}T12:00:00`).getTime()) / 86400000)
    : 0;
  const recentSuccessfulAttempts = successfulAttempts.slice(-2);
  const mastered = successfulDates.length >= 3
    && spanDays >= 7
    && sceneSuccessDates.length >= 1
    && recentSuccessfulAttempts.length === 2
    && recentSuccessfulAttempts.every((attempt) => attempt.hintLevel < 3);
  const reviewDelay = successfulDates.length <= 1 ? 1 : successfulDates.length === 2 ? 3 : 7;

  return {
    ...state,
    patternRecords: {
      ...state.patternRecords,
      [patternId]: {
        ...current,
        status: mastered ? "mastered" : result.success ? "review" : current.status === "new" ? "learning" : "review",
        attempts: current.attempts + 1,
        failures: current.failures + (result.success ? 0 : 1),
        hintsUsed: current.hintsUsed + (result.hintLevel > 0 ? 1 : 0),
        successfulAttempts,
        successfulDates,
        sceneSuccessDates,
        lastPracticedAt: date,
        nextReviewAt: result.success ? addDays(date, reviewDelay) : date
      }
    }
  };
};

export const selectDueReviews = (state: LearningState, excludedIds: number[], date = localDateKey()) =>
  Object.entries(state.patternRecords)
    .map(([id, record]) => ({ id: Number(id), record }))
    .filter(({ id, record }) => !excludedIds.includes(id) && record.status !== "new" && record.nextReviewAt && record.nextReviewAt <= date)
    .sort((a, b) => {
      const failureDiff = b.record.failures - a.record.failures;
      if (failureDiff !== 0) return failureDiff;
      return (a.record.nextReviewAt ?? "").localeCompare(b.record.nextReviewAt ?? "");
    })
    .slice(0, 5)
    .map(({ id }) => id);

export const getSessionKey = (day: number, date = localDateKey()) => `${date}:day-${day}`;

export const createLessonSession = (state: LearningState, day: number, excludedPatternIds: number[] = []): LessonSession => {
  const date = localDateKey();
  const reviewPatternIds = selectDueReviews(state, excludedPatternIds);
  return {
    day,
    date,
    phase: reviewPatternIds.length > 0 ? "review" : "patterns",
    reviewPatternIds,
    reviewIndex: 0,
    patternIndex: 0,
    attempt: 1,
    hintLevel: 0,
    messages: [],
    turn: 0,
    usedPatternIds: [],
    expressionDimensions: [],
    coachNotes: [],
    completedAt: null,
    updatedAt: new Date().toISOString()
  };
};

export const loadLearningState = (): LearningState => {
  if (typeof window === "undefined") return createLearningState();
  const raw = window.localStorage.getItem(LEARNING_STATE_KEY);
  if (!raw) {
    const legacyRaw = window.localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (!legacyRaw) return createLearningState();
    try {
      const migrated = migrateLegacyState(JSON.parse(legacyRaw));
      saveLearningState(migrated);
      return migrated;
    } catch {
      return createLearningState();
    }
  }
  try {
    return mergeLearningState(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(LEARNING_STATE_KEY);
    return createLearningState();
  }
};

export const saveLearningState = (state: LearningState) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LEARNING_STATE_KEY, JSON.stringify(state));
  }
};
