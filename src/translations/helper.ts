// Modern translation system for Obsidian plugins
import { moment } from "obsidian";
import { translationManager } from "./manager";
export type { TranslationKey } from "./types";

// Initialize translations
export async function initializeTranslations(): Promise<void> {
  const currentLocale = moment.locale();
  translationManager.setLocale(currentLocale);
}

// Export the translation function
export const t = translationManager.t.bind(translationManager);
