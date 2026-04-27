import { cookies } from "next/headers";

export const locales = ["ms", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "dt_locale";

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "ms" ? "ms" : "en";
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value);
}

export function pickByLocale<T>(locale: Locale, copy: Record<Locale, T>): T {
  return copy[locale] ?? copy[defaultLocale];
}
