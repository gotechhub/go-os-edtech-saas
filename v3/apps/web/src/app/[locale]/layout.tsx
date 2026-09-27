import { notFound } from "next/navigation";

const locales = new Set(["tr", "en"]);

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!locales.has(locale)) notFound();
  return <div lang={locale === "tr" ? "tr-TR" : "en-US"} dir="ltr">{children}</div>;
}
