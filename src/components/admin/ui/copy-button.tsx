"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, type AdminButtonProps } from "./button";
import { useToast } from "./toast";

async function writeClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for insecure origins / older in-app browsers.
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copy failed");
}

/** Copies `value` and confirms with a toast; the icon flips to a check for a moment. */
export function CopyButton({
  value,
  children = "Nusxalash",
  toastTitle = "Havola nusxalandi",
  toastDescription,
  variant = "primary",
  size = "sm",
  disabled,
  className,
}: {
  value: string;
  children?: string;
  toastTitle?: string;
  toastDescription?: string;
  variant?: AdminButtonProps["variant"];
  size?: AdminButtonProps["size"];
  disabled?: boolean;
  className?: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const copy = async () => {
    try {
      await writeClipboard(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
      toast.success(toastTitle, toastDescription);
    } catch {
      toast.error("Nusxalab boʻlmadi", "Havolani belgilab, qoʻlda nusxalang.");
    }
  };

  return (
    <Button variant={variant} size={size} icon={copied ? <Check /> : <Copy />} onClick={copy} disabled={disabled} className={className}>
      {copied ? "Nusxalandi" : children}
    </Button>
  );
}
