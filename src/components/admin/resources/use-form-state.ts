"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FieldErrors, FormValues } from "./form-values";

/** Minimal form state for the generic editor: values, dirty tracking and path-keyed errors. */
export function useFormState(initial: FormValues) {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!Object.keys(e).some((k) => k === name || k.startsWith(`${name}.`))) return e;
      const next: FieldErrors = {};
      for (const [k, msg] of Object.entries(e)) if (k !== name && !k.startsWith(`${name}.`)) next[k] = msg;
      return next;
    });
  }, []);

  const reset = useCallback((next: FormValues) => {
    setBaseline(JSON.stringify(next));
    setValues(next);
    setErrors({});
  }, []);

  const dirty = useMemo(() => JSON.stringify(values) !== baseline, [values, baseline]);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  return { values, setValue, errors, setErrors, reset, dirty };
}
