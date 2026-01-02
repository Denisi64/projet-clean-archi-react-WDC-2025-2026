import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const SUPPORTED_LOCALES = ["fr", "en"] as const;
const DEFAULT_LOCALE = "fr";

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    const locale = cookieLocale ?? DEFAULT_LOCALE;
    const resolvedLocale = SUPPORTED_LOCALES.includes(
        locale as (typeof SUPPORTED_LOCALES)[number],
    )
        ? locale
        : DEFAULT_LOCALE;
    const messages = (await import(`./messages/${resolvedLocale}.json`)).default;
    return { locale: resolvedLocale, messages };
});
