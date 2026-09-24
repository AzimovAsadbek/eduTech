/**
 * Helpers for the per-locale translation layer of the generic resource editor.
 * Translations live in form state as `values.translations = { ru: { <field>: <form value> }, en: {…} }`
 * and are shipped as `{ ru: { <field>: <payload value> } }` with empty entries dropped so the site falls back to Uzbek.
 */
import { z } from "zod";
import { TRANSLATION_LOCALES, translatableFields, type FieldDef, type ResourceUi, type TranslationLocale } from "./config";

export type TranslationValues = Partial<Record<TranslationLocale, Record<string, unknown>>>;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Stored JSON → form-shaped value for one translatable field (mirrors `toFormValues` for the base field). */
function fieldToForm(f: FieldDef, v: unknown): unknown {
  switch (f.type) {
    case "string-list":
      return Array.isArray(v) ? v.map(str) : [];
    case "json-list":
      return Array.isArray(v) ? v.map((row) => asRecord(row) ?? {}) : [];
    default:
      return str(v);
  }
}

/** Prisma `translations` column → editable per-locale values. Unknown keys are carried through untouched. */
export function toTranslationValues(ui: ResourceUi, raw: unknown): TranslationValues {
  const source = asRecord(raw) ?? {};
  const fields = translatableFields(ui);
  const out: TranslationValues = {};
  for (const locale of TRANSLATION_LOCALES) {
    const stored = asRecord(source[locale]) ?? {};
    const values: Record<string, unknown> = { ...stored };
    for (const f of fields) values[f.name] = fieldToForm(f, stored[f.name]);
    out[locale] = values;
  }
  return out;
}

/** A translated value counts as "filled" when it would override the Uzbek original on the site. */
export function isFilled(v: unknown): boolean {
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return v !== null && v !== undefined && v !== "";
}

/** Form value → cleaned payload value, or `undefined` when the field should be omitted. */
function fieldToPayload(f: FieldDef, v: unknown): unknown {
  switch (f.type) {
    case "string-list": {
      const list = Array.isArray(v)
        ? v
            .map(str)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      return list.length ? list : undefined;
    }
    case "json-list": {
      const rows = Array.isArray(v) ? v.map((row) => asRecord(row) ?? {}) : [];
      const cleaned = rows
        .map((row) => {
          const o: Record<string, unknown> = {};
          for (const [k, val] of Object.entries(row)) {
            if (Array.isArray(val)) {
              const list = val
                .map(str)
                .map((s) => s.trim())
                .filter(Boolean);
              o[k] = list;
            } else {
              const s = str(val).trim();
              if (s) o[k] = s;
            }
          }
          return o;
        })
        .filter((o) => Object.values(o).some(isFilled));
      return cleaned.length ? cleaned : undefined;
    }
    default: {
      const s = str(v).trim();
      return s ? s : undefined;
    }
  }
}

/** Per-locale form values → API payload. Returns `null` when nothing is translated so the column stays clean. */
export function toTranslationsPayload(ui: ResourceUi, values: unknown): Record<string, Record<string, unknown>> | null {
  const source = asRecord(values) ?? {};
  const fields = translatableFields(ui);
  const names = new Set(fields.map((f) => f.name));
  const out: Record<string, Record<string, unknown>> = {};
  for (const locale of TRANSLATION_LOCALES) {
    const form = asRecord(source[locale]) ?? {};
    const entry: Record<string, unknown> = {};
    // Keys this UI does not manage (written by scripts or other tools) are preserved verbatim.
    for (const [k, v] of Object.entries(form)) if (!names.has(k) && isFilled(v)) entry[k] = v;
    for (const f of fields) {
      const v = fieldToPayload(f, form[f.name]);
      if (v !== undefined) entry[f.name] = v;
    }
    if (Object.keys(entry).length) out[locale] = entry;
  }
  return Object.keys(out).length ? out : null;
}

export interface TranslationProgress {
  done: number;
  total: number;
}

/** Filled / total translatable fields for one locale. Works on both stored JSON and form values. */
export function translationProgress(ui: ResourceUi, translations: unknown, locale: TranslationLocale): TranslationProgress {
  const total = ui.translatable.length;
  const entry = asRecord(asRecord(translations)?.[locale]);
  if (!entry) return { done: 0, total };
  let done = 0;
  for (const name of ui.translatable) if (isFilled(entry[name])) done += 1;
  return { done, total };
}

/**
 * Validation for the translation payload: each translatable field reuses its base-schema rule
 * (trim, max length, list limits), made optional because every translation may be left blank.
 */
export function translationsSchemaFor(ui: ResourceUi): z.ZodType {
  const shape = ui.schema.shape;
  const picked: Record<string, z.ZodType> = {};
  for (const name of ui.translatable) {
    const field = shape[name];
    if (field instanceof z.ZodType) picked[name] = field.optional();
  }
  return z.partialRecord(z.enum(TRANSLATION_LOCALES), z.object(picked).partial()).nullable();
}

/** Deep-copies a form value so the translation editor never shares references with the Uzbek base. */
export function cloneFormValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(cloneFormValue);
  const rec = asRecord(v);
  if (rec) return Object.fromEntries(Object.entries(rec).map(([k, x]) => [k, cloneFormValue(x)]));
  return v;
}

/** One-line preview of an Uzbek original for the reference hint under a translation field. */
export function describeOriginal(f: FieldDef, v: unknown): string {
  switch (f.type) {
    case "string-list":
      return Array.isArray(v) ? v.map(str).filter(Boolean).join(" · ") : "";
    case "json-list": {
      const rows = Array.isArray(v) ? v.map((row) => asRecord(row) ?? {}) : [];
      return rows.map((row, i) => str(row.title ?? row.url ?? `#${i + 1}`)).join(" · ");
    }
    default:
      return str(v);
  }
}
