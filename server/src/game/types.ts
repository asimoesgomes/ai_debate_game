export type Language = "en" | "pt";

export type Avatar = {
  style: "emoji" | "color" | "upload";
  value: string; // e.g., 😊, #a3d, or uploaded filename
};

export type Player = {
  id: string;
  name: string;
  language: Language;
  avatar: Avatar;
  profiles: Record<string, PreparedPosition>; // keyed by topicId
  points: number;
};

export type StageMode = "lightning" | "deep";

export type Topic = {
  id: string;
  category: "debate" | "forecast";
  prompt: { en: string; pt: string };
  // For forecast mode only
  truth?: number; // 0-100 (example scale)
};

export type PreparedPosition = {
  topicId: string;
  mode: StageMode;
  // Player-authored content gathered via Socratic stage
  beliefs: string[]; // beliefs about the state of the world
  actions: string[]; // proposed actions
  mechanisms: string[]; // causal mediators linking actions -> outcomes
  outcomes: string[]; // intended outcomes
  evidence: string[]; // anecdotes/experience
  tradeoffs: string[]; // risks/downsides
  metrics: string[]; // how to measure success
  summary: string; // short synthesis in player's own words
  complete: boolean;
};

export type DebateTurn = {
  playerId: string;
  text: string; // generated only from player's own prepared content
  role: "opening" | "rebuttal" | "closing";
};

export type DebateTranscript = DebateTurn[];

export type Vote = {
  voterPlayerId: string;
  votedForPlayerId: string;
  justification: string; // must reference only player's provided content
};

export type RoundResult = {
  roundId: string;
  topicId: string;
  transcript: DebateTranscript;
  votes: Vote[];
  winnerPlayerId: string | null; // null for tie
  scoresAwarded: Record<string, number>; // playerId -> points change
  feedbackByPlayer: Record<string, PlayerFeedback>;
};

export type PlayerFeedback = {
  highlights: string[];
  improvements: string[];
};

export type ForecastEntry = {
  roundId: string;
  topicId: string;
  estimates: Record<string, number>; // playerId -> 0..100
  truth: number; // 0..100
  distances: Record<string, number>; // abs error
  scoresAwarded: Record<string, number>;
};

export type InMemoryDB = {
  players: Map<string, Player>;
  topics: Topic[];
  rounds: RoundResult[];
  forecastRounds: ForecastEntry[];
};
