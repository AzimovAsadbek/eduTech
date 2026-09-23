"use client";

import { FieldWrap, Input } from "@/components/admin/ui/field";
import type { FieldErrors } from "../form-values";

type Socials = { telegram: string; instagram: string; linkedin: string };

export function SocialsField({ name, label, value, onChange, errors }: { name: string; label: string; value: Socials; onChange: (v: Socials) => void; errors: FieldErrors }) {
  return (
    <FieldWrap label={label} error={errors[name]} as="div">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Telegram" value={value.telegram} onChange={(e) => onChange({ ...value, telegram: e.target.value })} placeholder="@username" error={errors[`${name}.telegram`]} />
        <Input label="Instagram" value={value.instagram} onChange={(e) => onChange({ ...value, instagram: e.target.value })} placeholder="@username" error={errors[`${name}.instagram`]} />
        <Input label="LinkedIn" value={value.linkedin} onChange={(e) => onChange({ ...value, linkedin: e.target.value })} placeholder="https://linkedin.com/in/…" error={errors[`${name}.linkedin`]} />
      </div>
    </FieldWrap>
  );
}
