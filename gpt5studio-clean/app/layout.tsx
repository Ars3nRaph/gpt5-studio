import "@/styles/globals.css";
import type { ReactNode } from "react";
export const metadata = { title: "GPT-5 Studio", description: "Clone ChatGPT – GPT-5, code & documents" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (<html lang="fr"><body>{children}</body></html>);
}
