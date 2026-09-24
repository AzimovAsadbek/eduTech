import type { FieldDef, JsonShape, ResourceUi } from "./config";
import { toTranslationsPayload, toTranslationValues } from "./translations";

export type FormValues = Record<string, unknown>;

/** Zod issue → Uzbek copy. Custom schema messages are kept; only Zod's English defaults are translated. */
export function localizeIssue(issue: {
  code: string;
  message: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  origin?: string;
  expected?: string;
}): string {
  const isDefault = /^(Too small|Too big|Invalid|Unrecognized|Expected|Input|Required)/.test(issue.message);
  if (!isDefault) return issue.message;
  const n = (v: number | bigint | undefined) => (v === undefined ? "" : String(v));
  switch (issue.code) {
    case "too_small":
      if (issue.origin === "array") return Number(issue.minimum) <= 1 ? "Kamida bitta element kiriting" : `Kamida ${n(issue.minimum)} ta element`;
      if (issue.origin === "number") return `Qiymat ${n(issue.minimum)} dan kichik boʻlmasin`;
      return Number(issue.minimum) <= 1 ? "Bu maydon majburiy" : `Kamida ${n(issue.minimum)} ta belgi`;
    case "too_big":
      if (issue.origin === "array") return `Koʻpi bilan ${n(issue.maximum)} ta element`;
      if (issue.origin === "number") return `Qiymat ${n(issue.maximum)} dan katta boʻlmasin`;
      return `Koʻpi bilan ${n(issue.maximum)} ta belgi`;
    case "invalid_type":
      return issue.expected === "number" ? "Raqam kiriting" : "Bu maydon majburiy";
    case "invalid_format":
      return "Format notoʻgʻri";
    case "invalid_value":
      return "Notoʻgʻri qiymat";
    default:
      return "Qiymat notoʻgʻri";
  }
}
export type FieldErrors = Record<string, string>;

export const JSON_SHAPES: Record<
  JsonShape,
  { itemLabel: string; fields: { key: string; label: string; kind: "text" | "textarea" | "string-list"; placeholder?: string }[] }
> = {
  curriculum: {
    itemLabel: "Modul",
    fields: [
      { key: "title", label: "Modul nomi", kind: "text" },
      { key: "lessons", label: "Darslar", kind: "string-list", placeholder: "Dars nomi" },
    ],
  },
  projects: {
    itemLabel: "Loyiha",
    fields: [
      { key: "title", label: "Nomi", kind: "text" },
      { key: "description", label: "Tavsif", kind: "textarea" },
    ],
  },
  process: {
    itemLabel: "Bosqich",
    fields: [
      { key: "step", label: "Raqam", kind: "text", placeholder: "01" },
      { key: "title", label: "Nomi", kind: "text" },
      { key: "description", label: "Tavsif", kind: "textarea" },
    ],
  },
  videos: {
    itemLabel: "Video",
    fields: [
      { key: "url", label: "URL", kind: "text", placeholder: "https://youtube.com/…" },
      { key: "title", label: "Sarlavha", kind: "text" },
      { key: "poster", label: "Poster (URL)", kind: "text" },
    ],
  },
};

export function emptyJsonItem(shape: JsonShape): Record<string, unknown> {
  return Object.fromEntries(JSON_SHAPES[shape].fields.map((f) => [f.key, f.kind === "string-list" ? [] : ""]));
}

export function allFields(ui: ResourceUi): FieldDef[] {
  return ui.sections.flatMap((s) => s.fields);
}

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** Prisma row (or nothing) → editable form values. */
export function toFormValues(ui: ResourceUi, item: Record<string, unknown> | null): FormValues {
  const out: FormValues = {};
  for (const f of allFields(ui)) {
    const v = item?.[f.name];
    switch (f.type) {
      case "text":
      case "slug":
      case "textarea":
      case "color":
      case "image":
        out[f.name] = str(v);
        break;
      case "number":
        out[f.name] = v === null || v === undefined ? "" : String(v);
        break;
      case "select":
        out[f.name] = typeof v === "string" ? v : (f.options[0]?.value ?? "");
        break;
      case "relation":
        out[f.name] = typeof v === "string" ? v : "";
        break;
      case "multiselect": {
        const rel = item?.teachers;
        out[f.name] = Array.isArray(rel)
          ? rel
              .map((r) => (r as { teacher?: { id?: string }; teacherId?: string }).teacher?.id ?? (r as { teacherId?: string }).teacherId)
              .filter((x): x is string => typeof x === "string")
          : [];
        break;
      }
      case "boolean":
        out[f.name] = Boolean(v);
        break;
      case "string-list":
        out[f.name] = Array.isArray(v) ? v.map(str) : [];
        break;
      case "json-list":
        out[f.name] = Array.isArray(v)
          ? v.map((row) => ({ ...emptyJsonItem(f.shape), ...(row && typeof row === "object" ? (row as Record<string, unknown>) : {}) }))
          : [];
        break;
      case "socials": {
        const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
        out[f.name] = { telegram: str(o.telegram), instagram: str(o.instagram), linkedin: str(o.linkedin) };
        break;
      }
    }
  }
  if (ui.hasStatus) out.status = typeof item?.status === "string" ? item.status : "DRAFT";
  out.order = typeof item?.order === "number" ? String(item.order) : "0";
  if (ui.panelToggle) out[ui.panelToggle.name] = item ? Boolean(item[ui.panelToggle.name]) : ui.panelToggle.name === "isActive";
  out.translations = toTranslationValues(ui, item?.translations);
  return out;
}

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Form values → API payload (before Zod validation). */
export function toPayload(ui: ResourceUi, values: FormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of allFields(ui)) {
    const v = values[f.name];
    switch (f.type) {
      case "text":
      case "slug":
      case "textarea":
        out[f.name] = f.required ? str(v).trim() : blankToNull(str(v).trim());
        break;
      case "color":
      case "image":
      case "relation":
        out[f.name] = blankToNull(str(v).trim());
        break;
      case "number":
        out[f.name] = str(v).trim() === "" ? null : Number(v);
        break;
      case "select":
        out[f.name] = f.nullable ? blankToNull(v) : v;
        break;
      case "multiselect":
        out[f.name] = Array.isArray(v) ? v : [];
        break;
      case "boolean":
        out[f.name] = Boolean(v);
        break;
      case "string-list":
        out[f.name] = Array.isArray(v)
          ? v
              .map(str)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        break;
      case "json-list": {
        const rows = Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
        const shape = JSON_SHAPES[f.shape];
        const cleaned = rows.map((row) => {
          const o: Record<string, unknown> = {};
          for (const sf of shape.fields) {
            const val = row[sf.key];
            if (sf.kind === "string-list")
              o[sf.key] = Array.isArray(val)
                ? val
                    .map(str)
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];
            else {
              const s = str(val).trim();
              // optional sub-fields are omitted when blank so `.optional()` passes
              if (
                s ||
                (f.shape === "curriculum" && sf.key === "title") ||
                f.shape === "process" ||
                (f.shape === "videos" && sf.key === "url") ||
                (f.shape === "projects" && sf.key === "title")
              )
                o[sf.key] = s;
            }
          }
          return o;
        });
        out[f.name] = cleaned.length ? cleaned : null;
        break;
      }
      case "socials": {
        const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
        const s: Record<string, string> = {};
        for (const k of ["telegram", "instagram", "linkedin"]) {
          const val = str(o[k]).trim();
          if (val) s[k] = val;
        }
        out[f.name] = Object.keys(s).length ? s : null;
        break;
      }
    }
  }
  if (ui.hasStatus) out.status = values.status;
  out.order = str(values.order).trim() === "" ? 0 : Number(values.order);
  if (ui.panelToggle) out[ui.panelToggle.name] = Boolean(values[ui.panelToggle.name]);
  // Always sent as a whole object: PATCH forwards only present keys, so a partial object would drop the other locale.
  out.translations = toTranslationsPayload(ui, values.translations);
  return out;
}
