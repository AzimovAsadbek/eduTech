"use client";

import { useCallback, useState } from "react";
import { adminApi, errorMessage } from "@/lib/admin-api";
import type { UploadItem } from "./types";

export interface UploaderState {
  progress: number | null;
  error: string | null;
}

/** Shared upload logic (multipart `file`, optional `alt`) with progress. */
export function useUploader() {
  const [state, setState] = useState<UploaderState>({ progress: null, error: null });

  const upload = useCallback(async (file: File, alt?: string): Promise<UploadItem | null> => {
    if (!file.type.startsWith("image/")) {
      setState({ progress: null, error: "Faqat rasm fayllari qabul qilinadi" });
      return null;
    }
    const form = new FormData();
    form.append("file", file);
    if (alt) form.append("alt", alt);
    setState({ progress: 0, error: null });
    try {
      const { data } = await adminApi.upload<UploadItem>("/uploads", form, (p) => setState({ progress: p, error: null }));
      setState({ progress: null, error: null });
      return data;
    } catch (e) {
      setState({ progress: null, error: errorMessage(e, "Yuklab boʻlmadi") });
      return null;
    }
  }, []);

  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  return { ...state, upload, clearError };
}
