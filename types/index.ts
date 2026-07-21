// ============================================================
// Papaw — Type Definitions
// ============================================================

// --- Profile ---
export interface Profile {
  id: string;
  child_name: string;
  papaw_name: string; // default 'Papaw'
  default_language: Language;
  child_gender: Gender;
  parent_view_key: string;
  username: string | null;
  pin_hash: string | null; // "salt:hash" — server-only, never sent to client
  created_at: string;
}

export type Language = 'id' | 'en' | 'mix';
export type Gender = 'male' | 'female' | 'unspecified';

// --- Session ---
export interface Session {
  id: string;
  profile_id: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  mission_state: MissionState | null;
}

// --- Message ---
export interface Message {
  id: string;
  session_id: string;
  role: 'child' | 'papaw';
  content: string;
  topic_tags: string[];
  is_critical_topic: boolean;
  created_at: string;
}

// --- Badge ---
export interface Badge {
  id: string;
  profile_id: string;
  badge_key: string; // mission identifier
  title: string;
  icon: string;
  earned_at: string;
}

// --- Whisper ---
export interface Whisper {
  id: string;
  profile_id: string;
  message: string;
  scheduled_for: string | null;
  delivered_at: string | null;
  created_at: string;
}

// --- Topic Frequency ---
export interface TopicFrequency {
  id: string;
  profile_id: string;
  topic: string;
  count: number;
  last_explored: string;
}

// --- Highlight ---
export interface Highlight {
  id: string;
  profile_id: string;
  message_id: string;
  highlight_type: HighlightType;
  excerpt: string;
  created_at: string;
}

export type HighlightType = 'curious_question' | 'cute_moment' | 'deep_thinking';

// ============================================================
// Bedtime & Time Context
// ============================================================

export type BedtimeContext = 'daytime' | 'evening' | 'bedtime';

// ============================================================
// LLM
// ============================================================

export interface LLMMessage {
  role: 'user' | 'model';
  content: string;
}

export interface LLMProvider {
  chat(messages: LLMMessage[], systemPrompt: string): Promise<string>;
  streamChat(messages: LLMMessage[], systemPrompt: string): AsyncIterable<string>;
  analyze(content: string, schema: AnalysisSchema): Promise<AnalysisResult>;
}

export interface AnalysisSchema {
  description: string;
}

export interface AnalysisResult {
  topic_tags: string[];
  is_critical: boolean;
  is_highlight: HighlightType | null;
  excerpt: string | null;
  facts: string[]; // durable facts about the child worth remembering
}

// --- Child Memory ---
export interface ChildFact {
  id: string;
  profile_id: string;
  fact: string;
  category: string;
  created_at: string;
}

// ============================================================
// Papaw Context (injected into prompts)
// ============================================================

export interface PapawContext {
  childName: string;
  papawName: string;
  language: Language;
  childGender: Gender;
  memoryFacts: string[];
  bedtimeContext: BedtimeContext;
  currentTime: string; // human-readable
  currentDay: string;  // e.g., 'Jumat'
  recentMessages: LLMMessage[];
  pendingWhispers: Whisper[];
  missionState: MissionState | null;
}

// ============================================================
// Mission System
// ============================================================

export type MissionCategory =
  | 'tokoh_dunia'
  | 'peristiwa_sejarah'
  | 'luar_angkasa'
  | 'hewan_alam'
  | 'penemuan_sains'
  | 'teknologi'
  | 'bumi_iklim'
  | 'dunia_digital';

export interface MissionDefinition {
  id: string;
  category: MissionCategory;
  title: string;
  description: string;
  icon: string;
  totalSteps: number; // 5-7 conversation turns
  quizQuestions: QuizQuestion[];
  badgeTitle: string;
  badgeIcon: string;
  systemContext: string; // injected into mission prompt
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type MissionPhase = 'intro' | 'conversation' | 'quiz' | 'complete';

export interface MissionState {
  missionId: string;
  phase: MissionPhase;
  currentStep: number; // 0-based within phase
  quizAnswers: number[]; // indices of selected answers
  quizScore: number;
  startedAt: string;
}

// ============================================================
// API Request / Response Types
// ============================================================

// --- Chat API ---
export interface ChatRequest {
  profileId: string;
  message: string;
  sessionId?: string;
  mode: 'free' | 'mission';
}

export interface ChatResponse {
  response: string;
  sessionId: string;
}

// --- Mission API ---
export type MissionAction = 'start' | 'step' | 'complete';

export interface MissionRequest {
  action: MissionAction;
  profileId: string;
  missionId?: string;
  message?: string;
  sessionId?: string;
  quizAnswer?: number;
}

export interface MissionResponse {
  response: string;
  sessionId: string;
  missionState: MissionState;
  badge?: Badge;
}

// --- Whisper API ---
export type WhisperAction = 'create' | 'pending' | 'mark-delivered' | 'history';

export interface WhisperRequest {
  action: WhisperAction;
  key?: string; // parent_view_key for create
  profileId?: string;
  message?: string;
  scheduledFor?: string;
  whisperId?: string;
}

export interface WhisperResponse {
  success: boolean;
  whispers?: Whisper[];
  whisper?: Whisper;
}

// --- Papa View API ---
export type PapaViewAction = 'summary' | 'highlights' | 'topics' | 'history';

export interface PapaViewRequest {
  action: PapaViewAction;
  key: string;
  dateRange?: 'today' | 'week' | 'month';
  page?: number;
  limit?: number;
}

export interface TodaySummary {
  sessionCount: number;
  messageCount: number;
  totalDurationMinutes: number;
  dominantTopics: string[];
  criticalTopicAlerts: CriticalAlert[];
}

export interface WeekSummary {
  streakDays: number;
  totalSessions: number;
  trendingTopics: string[];
  dailyActivity: { date: string; messageCount: number }[];
}

export interface CriticalAlert {
  messageId: string;
  topic: string;
  excerpt: string;
  timestamp: string;
}

// --- Analyze API ---
export interface AnalyzeRequest {
  messageId: string;
  childMessage: string;
  papawResponse: string;
  profileId: string;
}

// ============================================================
// UI State
// ============================================================

export interface OnboardingData {
  childName: string;
  language: Language;
}

export interface CategoryInfo {
  id: MissionCategory;
  title: string;
  icon: string;
  description: string;
  color: string;
  missions: MissionDefinition[];
  completedCount: number;
}
