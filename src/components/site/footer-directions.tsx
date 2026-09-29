"use client";

import { Link, usePathname } from "@/i18n/navigation";

export interface FooterColumn {
  title: string;
  links: { href: string; label: string }[];
}

/** Footer's second column follows the section you are in: agency links on /media pages, academy links everywhere else. */
export function FooterDirections({ academy, agency }: { academy: FooterColumn; agency: FooterColumn }) {
  const pathname = usePathname();
  const column = pathname === "/media" || pathname.startsWith("/media/") ? agency : academy;
  return (
    <div>
      <p className="t-eyebrow mb-3 text-white/45">{column.title}</p>
      <ul className="space-y-2 text-sm">
        {column.links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-white/80 transition-colors hover:text-orange">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
