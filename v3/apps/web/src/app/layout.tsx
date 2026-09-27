import type { Metadata } from "next";
import "@respongo-os/design-tokens/tokens.css";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "Respongo OS", template: "%s · Respongo OS" },
  description: "Kurumsal öğrenme, yetenek ve performans işletim sistemi",
};

const themeScript = `try{const t=localStorage.getItem('respongo-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
