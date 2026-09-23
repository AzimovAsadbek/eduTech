"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const controlBase =
  "w-full rounded-[10px] border border-(--line-strong) bg-paper px-3 text-sm text-ink placeholder:text-muted-2 transition-[border-color,box-shadow] duration-150 focus:border-orange focus:outline-none focus:ring-3 focus:ring-orange/15 disabled:bg-paper-3 disabled:opacity-70 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15";

export interface FieldWrapProps {
  id?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  /** Use a non-label element when the control is not labelable (e.g. a group). */
  as?: "label" | "div";
}

export function FieldWrap({ id, label, hint, error, required, children, className, as = "label" }: FieldWrapProps) {
  const LabelTag = as === "label" ? "label" : "span";
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <LabelTag htmlFor={as === "label" ? id : undefined} className="block text-[13px] font-semibold text-ink">
          {label}
          {required ? (
            <span className="ml-0.5 text-orange" aria-hidden>
              *
            </span>
          ) : null}
        </LabelTag>
      ) : null}
      {children}
      {error ? (
        <p id={id ? `${id}-error` : undefined} role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={id ? `${id}-hint` : undefined} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapClassName?: string;
  leading?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, id, className, wrapClassName, required, leading, ...props }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  const control = (
    <input
      ref={ref}
      id={fid}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(fid, error, hint)}
      required={required}
      className={cn(controlBase, "h-10", leading && "pl-9", className)}
      {...props}
    />
  );
  return (
    <FieldWrap id={fid} label={label} hint={hint} error={error} required={required} className={wrapClassName}>
      {leading ? (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted [&>svg]:size-4" aria-hidden>
            {leading}
          </span>
          {control}
        </div>
      ) : (
        control
      )}
    </FieldWrap>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, id, className, wrapClassName, required, ...props }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap id={fid} label={label} hint={hint} error={error} required={required} className={wrapClassName}>
      <textarea
        ref={ref}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, error, hint)}
        required={required}
        className={cn(controlBase, "min-h-24 resize-y py-2.5 leading-relaxed", className)}
        {...props}
      />
    </FieldWrap>
  );
});

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapClassName?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const selectChrome =
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23737373%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:right_0.75rem_center] bg-no-repeat pr-9";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className, wrapClassName, options, placeholder, required, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap id={fid} label={label} hint={hint} error={error} required={required} className={wrapClassName}>
      <select
        ref={ref}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, error, hint)}
        required={required}
        className={cn(controlBase, "h-10", selectChrome, className)}
        {...props}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
});
