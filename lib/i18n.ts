import en from "@/locales/en.json";
import si from "@/locales/si.json";
import ta from "@/locales/ta.json";

export const dictionaries = { en, si, ta } as const;
export type Locale = keyof typeof dictionaries;
export function getDictionary(locale: Locale = "en") { return dictionaries[locale]; }
