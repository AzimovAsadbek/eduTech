import { cn } from "@/lib/utils";
import { Eyebrow } from "./eyebrow";

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center" | "split";
  as?: "h1" | "h2" | "h3";
  size?: "h1" | "h2" | "display";
  className?: string;
  aside?: React.ReactNode;
}

/** Editorial heading block; `split` puts title left and lead/aside right on desktop. */
export function SectionHeading({ eyebrow, title, lead, align = "left", as: Tag = "h2", size = "h2", className, aside }: Props) {
  const titleClass = size === "display" ? "t-display" : size === "h1" ? "t-h1" : "t-h2";
  if (align === "split") {
    return (
      <div className={cn("grid gap-6 lg:grid-cols-12 lg:items-end", className)}>
        <div className="lg:col-span-7">
          {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
          <Tag className={titleClass}>{title}</Tag>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          {lead ? <p className="t-lead max-w-md">{lead}</p> : null}
          {aside}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow className={cn("mb-4", align === "center" && "justify-center")}>{eyebrow}</Eyebrow> : null}
      <Tag className={titleClass}>{title}</Tag>
      {lead ? <p className={cn("t-lead mt-5", align === "center" ? "mx-auto max-w-2xl" : "max-w-xl")}>{lead}</p> : null}
      {aside}
    </div>
  );
}
