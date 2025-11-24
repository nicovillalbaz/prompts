export interface PromptSections {
  instruction: string;
  context: string;
  targetAudience: string;
  valueProposition: string;
  personality: string;
  detailLevel: string;
  additionalData: string;
  outputFormat: string;
}

export enum ObjectiveType {
  CREATE = 'Crear',
  ANALYZE = 'Analizar',
  TRANSLATE = 'Traducir',
  SUMMARIZE = 'Resumir',
  PERSUADE = 'Persuadir',
  CODE = 'Programar'
}

export enum DetailLevelType {
  BRIEF = 'Breve y directa',
  CONCISE = 'Concisa',
  DETAILED = 'Detallada y extensa',
  CREATIVE = 'Creativa',
  TECHNICAL = 'Técnica (para expertos)',
  SIMPLIFIED = 'Simplificada (para principiantes)'
}

export interface PromptRequest {
  basePrompt: string;
  objective: ObjectiveType;
  detailLevel: DetailLevelType;
}

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  date: string;
  type: ObjectiveType;
  sections: PromptSections;
  basePrompt: string;
  detailLevel: DetailLevelType;
}

export type View = 'constructor' | 'library';