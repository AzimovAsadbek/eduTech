// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Journey } from "@/components/site/home/journey";
import { JourneySteps } from "@/components/site/home/journey-steps";
import en from "../../messages/en/components.json";
import ru from "../../messages/ru/components.json";
import uz from "../../messages/uz/components.json";

const LOCALES = { uz, ru, en };

const renderJourney = () =>
  render(
    <NextIntlClientProvider locale="uz" messages={uz}>
      <Journey />
    </NextIntlClientProvider>,
  );

/** IntersectionObserver double: records every observer so a test can report an intersection by hand. */
class FakeObserver {
  static instances: FakeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean) {
    const entries = this.observed.map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry);
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

function setup({ top, reducedMotion = false }: { top: number; reducedMotion?: boolean }) {
  FakeObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reducedMotion && query.includes("reduce"), media: query }));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top } as DOMRect);
  render(
    <JourneySteps>
      <li>step</li>
    </JourneySteps>,
  );
  return screen.getByRole("list");
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("<Journey />", () => {
  it("is a labelled section with an h2 and an ordered list of four steps, each an h3 with an Uzbek stage tag", () => {
    renderJourney();
    const section = screen.getByRole("region", { name: /Bilimdan koʻnikmaga\. Koʻnikmadan kasbga\./ });
    expect(within(section).getByRole("heading", { level: 2 })).toHaveAttribute("id", "journey-title");

    const list = within(section).getByRole("list");
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    const steps = uz.journey.steps;
    items.forEach((item, i) => {
      expect(within(item).getByRole("heading", { level: 3 })).toHaveTextContent(steps[i].title);
      expect(within(item).getByText(steps[i].tag)).toBeInTheDocument();
      expect(within(item).getByText(steps[i].detail)).toBeInTheDocument();
    });
    expect(steps.map((s) => s.tag)).toEqual(["Bilim", "Koʻnikma", "Tajriba", "Kasb"]);
  });

  it("keeps numerals, lines and dots away from assistive tech", () => {
    renderJourney();
    for (const n of ["01", "02", "03", "04"]) {
      for (const el of screen.getAllByText(n)) expect(el.closest("[aria-hidden]")).not.toBeNull();
    }
    const decorative = screen.getByRole("list").querySelectorAll("li > span");
    decorative.forEach((el) => expect(el).toHaveAttribute("aria-hidden"));
  });

  it("renders fully visible server markup: no entrance state until the client decides to play it", () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="uz" messages={uz}>
        <Journey />
      </NextIntlClientProvider>,
    );
    expect(html).not.toContain("data-state");
    expect(html).toContain("Oʻrganish");
  });
});

describe("<JourneySteps /> entrance", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
  });

  it("hides a list that is still below the fold, then plays it once when it scrolls in", () => {
    const list = setup({ top: 1400 });
    expect(list).toHaveAttribute("data-state", "pending");
    expect(FakeObserver.instances).toHaveLength(1);
    const [observer] = FakeObserver.instances;
    expect(observer.observed).toEqual([list]);
    expect(observer.options?.rootMargin).toBe("0px 0px -25% 0px");

    observer.report(false);
    expect(list).toHaveAttribute("data-state", "pending");

    observer.report(true);
    expect(list).toHaveAttribute("data-state", "in");
    expect(observer.disconnected).toBe(true);
  });

  it("never hides a list that is already on screen (or scrolled past) at mount", () => {
    for (const top of [120, -600]) {
      const list = setup({ top });
      expect(list).not.toHaveAttribute("data-state");
      expect(FakeObserver.instances).toHaveLength(0);
      cleanup();
      vi.restoreAllMocks();
    }
  });

  it("does nothing under prefers-reduced-motion", () => {
    const list = setup({ top: 1400, reducedMotion: true });
    expect(list).not.toHaveAttribute("data-state");
    expect(FakeObserver.instances).toHaveLength(0);
  });

  it("stops observing and un-hides the list when torn down before the list was reached", () => {
    const list = setup({ top: 1400 });
    const [observer] = FakeObserver.instances;
    cleanup();
    expect(observer.disconnected).toBe(true);
    expect(list).not.toHaveAttribute("data-state");
  });
});

describe("journey copy", () => {
  it("has the same four steps in every locale, each with a stage tag, one sentence and a detail line", () => {
    for (const [locale, messages] of Object.entries(LOCALES)) {
      const steps = messages.journey.steps;
      expect(steps.map((s) => s.n), locale).toEqual(["01", "02", "03", "04"]);
      for (const s of steps) {
        for (const key of ["tag", "title", "text", "detail"] as const) expect(s[key].trim(), `${locale} ${s.n} ${key}`).not.toBe("");
        expect(s.text, `${locale} ${s.n} is one sentence`).not.toMatch(/[.!?…]\s+\S/);
        expect(s).not.toHaveProperty("key");
      }
    }
  });

  it("keeps English out of the Uzbek copy", () => {
    const copy = JSON.stringify(uz.journey);
    expect(copy).not.toMatch(/\b(learn|practi[cs]e|build|grow|review|feedback|retakes?|community|freelance)\b/i);
  });
});
