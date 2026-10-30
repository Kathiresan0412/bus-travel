import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Bus Finance Manager", description: "Daily finances for your bus business" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
