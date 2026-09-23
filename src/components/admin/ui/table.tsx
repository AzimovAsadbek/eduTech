import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ children, className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full min-w-[640px] border-collapse text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-paper-2">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-(--line)">{children}</tbody>;
}

export function Th({ children, className, align, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn("t-eyebrow h-10 border-b border-(--line) px-4 text-left text-[11px] font-medium text-muted", align === "right" && "text-right", align === "center" && "text-center", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, align, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <td className={cn("h-11 px-4 py-1.5 align-middle text-ink", align === "right" && "text-right", align === "center" && "text-center", className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({ children, className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("transition-colors duration-150 hover:bg-paper-2", className)} {...props}>
      {children}
    </tr>
  );
}
