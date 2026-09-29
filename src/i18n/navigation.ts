import { createNavigation } from "next-intl/navigation";
import { createElement, type ComponentProps } from "react";
import { routing } from "./routing";

const navigation = createNavigation(routing);

/** Locale-aware drop-ins for next/link and next/navigation — always use these in the public site. */
export const { redirect, usePathname, useRouter, getPathname } = navigation;

type LinkProps = ComponentProps<typeof navigation.Link>;

/**
 * Locale-aware link that also prefetches the destination's full page data on intent (pointer hover,
 * finger touch). Pages render per request, so without this a tap waits for the whole server round trip;
 * with it the request starts ~100–300 ms earlier and often completes before the click lands.
 * Needs `experimental.dynamicOnHover` in next.config.ts. Pass `unstable_dynamicOnHover={false}` to opt out.
 */
export function Link(props: LinkProps & { unstable_dynamicOnHover?: boolean }) {
  // next-intl forwards unknown props to next/link at runtime; its prop type just does not list this one.
  return createElement(navigation.Link, { unstable_dynamicOnHover: true, ...props } as LinkProps);
}
