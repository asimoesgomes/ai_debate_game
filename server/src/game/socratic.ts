import { PreparedPosition, StageMode, Topic } from "./types";

export type SocraticQuestion = {
  key:
    | "beliefs"
    | "actions"
    | "mechanisms"
    | "outcomes"
    | "evidence"
    | "tradeoffs"
    | "metrics"
    | "summary";
  text: { en: string; pt: string };
  minItems?: number;
};

// Ordered questioning plan; deep mode asks for more items
export const SOCRATIC_PLAN: SocraticQuestion[] = [
  {
    key: "beliefs",
    text: {
      en: "What beliefs about the current situation matter for this topic? List 1-3.",
      pt: "Quais crenças sobre a situação atual importam para este tema? Liste 1-3.",
    },
    minItems: 1,
  },
  {
    key: "actions",
    text: {
      en: "What actions would you take? List 1-3 actions.",
      pt: "Quais ações você tomaria? Liste 1-3 ações.",
    },
    minItems: 1,
  },
  {
    key: "mechanisms",
    text: {
      en: "Why would these actions work? Describe the causal path (1-2 items).",
      pt: "Por que essas ações funcionariam? Descreva o caminho causal (1-2 itens).",
    },
    minItems: 1,
  },
  {
    key: "outcomes",
    text: {
      en: "What outcomes do you expect in the short and long term?",
      pt: "Quais resultados você espera no curto e no longo prazo?",
    },
    minItems: 1,
  },
  {
    key: "evidence",
    text: {
      en: "What experiences or examples support your view?",
      pt: "Quais experiências ou exemplos apoiam sua visão?",
    },
  },
  {
    key: "tradeoffs",
    text: {
      en: "What are the risks or tradeoffs of your plan?",
      pt: "Quais são os riscos ou trocas do seu plano?",
    },
  },
  {
    key: "metrics",
    text: {
      en: "How would you measure success?",
      pt: "Como você mediria o sucesso?",
    },
  },
  {
    key: "summary",
    text: {
      en: "Summarize your plan in 2-3 sentences in your own words.",
      pt: "Resuma seu plano em 2-3 frases com suas próprias palavras.",
    },
  },
];

export function createEmptyPrepared(topicId: string, mode: StageMode): PreparedPosition {
  return {
    topicId,
    mode,
    beliefs: [],
    actions: [],
    mechanisms: [],
    outcomes: [],
    evidence: [],
    tradeoffs: [],
    metrics: [],
    summary: "",
    complete: false,
  };
}

export function nextQuestion(prepared: PreparedPosition, language: "en" | "pt"): SocraticQuestion | null {
  for (const q of SOCRATIC_PLAN) {
    const key = q.key;
    if (key === "summary") {
      if (!prepared.summary.trim()) return q;
      continue;
    }
    const arr = prepared[key] as string[];
    const min = q.minItems ?? 0;
    const required = prepared.mode === "deep" ? Math.max(min, 2) : min;
    if (arr.length < required) return q;
  }
  return null;
}

export function addAnswer(prepared: PreparedPosition, key: SocraticQuestion["key"], answer: string) {
  const trimmed = answer.trim();
  if (!trimmed) return;
  if (key === "summary") {
    prepared.summary = trimmed;
    return;
  }
  const arr = prepared[key] as string[];
  // Split on semicolons or line breaks for convenience
  const parts = trimmed
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const p of parts) arr.push(p);
}

export function isComplete(prepared: PreparedPosition): boolean {
  return (
    prepared.beliefs.length >= 1 &&
    prepared.actions.length >= 1 &&
    prepared.mechanisms.length >= 1 &&
    prepared.outcomes.length >= 1 &&
    prepared.summary.trim().length > 0
  );
}
