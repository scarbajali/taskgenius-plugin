export type TranslationKey = keyof typeof import('./locale/en').default;

export interface Translation {
  [key: string]: string | Translation;
}

export interface TranslationModule {
  default: Translation;
}

export interface TranslationOptions {
  namespace?: string;
  context?: string;
  interpolation?: Record<string, string | number>;
}

// Translation status for generation
export enum TranslationStatus {
  UNTRANSLATED = 'untranslated',
  OUTDATED = 'outdated',
  TRANSLATED = 'translated'
}

export interface TranslationEntry {
  key: string;
  status: TranslationStatus;
  context?: string;
  source: string;
  target?: string;
}

export interface TranslationTemplate {
  language: string;
  entries: TranslationEntry[];
  lastUpdated: string;
} 