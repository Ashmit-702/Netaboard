"use client";
import { useEffect, useState } from "react";
import { relativeLabel, formatISTDateTime } from "@/lib/time";

// Relative time ("8 min ago") that keeps itself current in the browser
// without a page reload. The exact timestamp is preserved in the element's
// dateTime/title, always shown in the site timezone (IST).
export default function RelTime({ iso }) {
  const [label, setLabel] = useState(() => relativeLabel(iso));
  useEffect(() => {
    setLabel(relativeLabel(iso));
    const id = setInterval(() => setLabel(relativeLabel(iso)), 60000);
    return () => clearInterval(id);
  }, [iso]);
  if (!iso) return null;
  return <time dateTime={iso} title={formatISTDateTime(iso)} suppressHydrationWarning>{label}</time>;
}
