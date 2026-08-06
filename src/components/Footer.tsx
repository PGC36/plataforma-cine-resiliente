"use client";

import { useLanguage } from "@/hooks/useLanguage";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <p>{t("footer")}</p>
    </footer>
  );
}
