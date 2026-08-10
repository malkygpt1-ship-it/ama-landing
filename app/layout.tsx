import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMA Review Builder",
  description: "Build clear, conversion-ready Amazon affiliate review pages from real product facts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
