"use client";

import { Input, Select, Textarea } from "@/components/admin/ui/field";
import { Switch } from "@/components/admin/ui/switch";
import { ImageField } from "@/components/admin/uploads/image-field";
import type { FieldDef, Option, RelationKey } from "./config";
import type { FieldErrors } from "./form-values";
import { ColorField } from "./fields/color-field";
import { JsonListField } from "./fields/json-list-field";
import { MultiSelectField } from "./fields/multiselect-field";
import { SocialsField } from "./fields/socials-field";
import { StringListField } from "./fields/string-list-field";

export interface FieldRendererProps {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  errors: FieldErrors;
  relations: Partial<Record<RelationKey, Option[]>>;
  onSlugTouched?: () => void;
}

const asString = (v: unknown) => (typeof v === "string" ? v : v === null || v === undefined ? "" : String(v));
const asStringArray = (v: unknown) => (Array.isArray(v) ? v.map(asString) : []);

export function FieldRenderer({ field: f, value, onChange, errors, relations, onSlugTouched }: FieldRendererProps) {
  // List fields get item-level issues ("images.2"); surface the first one on the field itself.
  const nested = Object.entries(errors).find(([k]) => k.startsWith(`${f.name}.`));
  const error = errors[f.name] ?? (nested ? `${Number(nested[0].split(".")[1]) + 1}-element: ${nested[1]}` : undefined);
  switch (f.type) {
    case "text":
      return (
        <Input
          label={f.label}
          hint={f.hint}
          error={error}
          required={f.required}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={f.placeholder}
          maxLength={f.maxLength}
        />
      );
    case "slug":
      return (
        <Input
          label={f.label}
          hint={f.hint}
          error={error}
          required={f.required}
          value={asString(value)}
          onChange={(e) => {
            onSlugTouched?.();
            onChange(e.target.value);
          }}
          spellCheck={false}
          className="font-mono text-[13px]"
        />
      );
    case "textarea":
      return (
        <Textarea
          label={f.label}
          hint={f.hint}
          error={error}
          required={f.required}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={f.rows ?? 4}
          maxLength={f.maxLength}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          inputMode="numeric"
          label={f.label}
          hint={f.hint}
          error={error}
          required={f.required}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          min={f.min}
          max={f.max}
        />
      );
    case "select":
      return (
        <Select
          label={f.label}
          hint={f.hint}
          error={error}
          required={f.required}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          options={f.options}
          placeholder={f.nullable ? "—" : undefined}
        />
      );
    case "relation":
      return (
        <Select
          label={f.label}
          hint={f.hint}
          error={error}
          required={f.required}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          options={relations[f.resource] ?? []}
          placeholder="— tanlanmagan —"
        />
      );
    case "multiselect":
      return <MultiSelectField label={f.label} hint={f.hint} error={error} resource={f.resource} value={asStringArray(value)} onChange={onChange} />;
    case "boolean":
      return <Switch label={f.label} hint={f.hint} checked={Boolean(value)} onChange={onChange} />;
    case "color":
      return <ColorField label={f.label} hint={f.hint} error={error} value={asString(value)} onChange={onChange} />;
    case "image":
      return <ImageField label={f.label} hint={f.hint} error={error} required={f.required} value={asString(value)} onChange={onChange} />;
    case "string-list":
      return (
        <StringListField
          label={f.label}
          hint={f.hint}
          error={error}
          required={f.required}
          value={asStringArray(value)}
          onChange={onChange}
          placeholder={f.placeholder}
        />
      );
    case "json-list":
      return (
        <JsonListField
          name={f.name}
          label={f.label}
          hint={f.hint}
          shape={f.shape}
          value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
          onChange={onChange}
          errors={errors}
        />
      );
    case "socials": {
      const v = value && typeof value === "object" ? (value as { telegram?: string; instagram?: string; linkedin?: string }) : {};
      return (
        <SocialsField
          name={f.name}
          label={f.label}
          value={{ telegram: v.telegram ?? "", instagram: v.instagram ?? "", linkedin: v.linkedin ?? "" }}
          onChange={onChange}
          errors={errors}
        />
      );
    }
  }
}
