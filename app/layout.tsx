import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "./sidebar";
import { AlertMonitor } from "./alert-monitor";
import { GlobalBugsOverlay } from "./global-bugs-overlay";
import { normalizeBasePath } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "OpenClaw Bot Dashboard",
  description: "查看所有 OpenClaw 机器人配置",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.NEXT_BASE_PATH ?? process.env.BASE_PATH ?? "");

  return (
    <html lang="zh-CN" data-base-path={basePath || undefined}>
      <body>
        <Providers>
          <AlertMonitor />
          <GlobalBugsOverlay />
          <div className="min-h-screen md:flex">
            <Sidebar />
            <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
