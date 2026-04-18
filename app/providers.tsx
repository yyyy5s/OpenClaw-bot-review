"use client";

import { I18nProvider } from "@/lib/i18n";
import { patchWindowFetchWithBasePath } from "@/lib/base-path";
import { ThemeProvider } from "@/lib/theme";
import { ReactNode, useEffect } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    return patchWindowFetchWithBasePath();
  }, []);

  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}
