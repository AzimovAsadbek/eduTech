import type { AbstractIntlMessages } from "next-intl";

/**
 * Message namespaces used by client components (`useTranslations` in "use client" files).
 * Only these are serialised into the page for the browser; server components read the full catalogue
 * on the server. `tests/unit/client-messages.test.ts` fails if a client component starts using a
 * namespace that is missing here.
 */
export const CLIENT_NAMESPACES = [
  "common",
  "cursor",
  "mobileBar",
  "growth",
  "leadForm",
  "applyDialog",
  "serviceExplorer",
  "journey",
  "courseIndex",
  "courseApply",
  "videoEmbed",
  "beforeAfter",
] as const;

/** Nested namespaces a client component needs from an otherwise server-only root. */
export const CLIENT_SUBTREES = [["pages", "error"]] as const;

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const out: AbstractIntlMessages = {};
  for (const ns of CLIENT_NAMESPACES) if (ns in messages) out[ns] = messages[ns];
  for (const [root, child] of CLIENT_SUBTREES) {
    const tree = messages[root];
    if (tree && typeof tree === "object" && child in tree) {
      const picked = (out[root] ??= {}) as AbstractIntlMessages;
      picked[child] = (tree as AbstractIntlMessages)[child];
    }
  }
  return out;
}
