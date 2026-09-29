// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import ruCommon from "../../messages/ru/common.json";
import uzCommon from "../../messages/uz/common.json";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

// next-intl's navigation helpers pull in `next/navigation`, which has no runtime under Vitest.
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/kurslar/dasturlash",
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const messages = { uz: uzCommon, ru: ruCommon };

function renderSwitcher(locale: keyof typeof messages = "uz", props: ComponentProps<typeof LanguageSwitcher> = {}) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <LanguageSwitcher {...props} />
    </NextIntlClientProvider>,
  );
}

const trigger = () => screen.getByRole("button", { name: /^(Til|Язык):/ });
const item = (name: string) => screen.getByRole("menuitemradio", { name });
const press = (key: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });

describe("<LanguageSwitcher />", () => {
  afterEach(() => {
    cleanup();
    replace.mockClear();
  });

  it("renders a closed menu button named after the current language, without mounting the menu", () => {
    renderSwitcher();
    const button = trigger();
    expect(button).toHaveAccessibleName("Til: Oʻzbekcha (UZ)");
    expect(button).toHaveTextContent("UZ");
    expect(button).toHaveAttribute("aria-haspopup", "menu");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button.getAttribute("aria-controls")).toBeTruthy();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows the native language name in the md size", () => {
    renderSwitcher("ru", { size: "md", inverted: true });
    expect(trigger()).toHaveAccessibleName("Язык: Русский");
    expect(trigger()).toHaveTextContent("Русский");
  });

  it("opens on click with menuitemradio options, the current language checked and focused", () => {
    renderSwitcher("ru");
    fireEvent.click(trigger());

    const menu = screen.getByRole("menu", { name: "Язык" });
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", menu.id);

    const options = within(menu).getAllByRole("menuitemradio");
    expect(options.map((o) => o.textContent)).toEqual([expect.stringContaining("Oʻzbekcha"), expect.stringContaining("Русский"), expect.stringContaining("English")]);
    expect(options.map((o) => o.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(item("Русский")).toHaveFocus();

    // Each native name is marked with its own language.
    expect(within(item("Oʻzbekcha")).getByText("Oʻzbekcha")).toHaveAttribute("lang", "uz");
    expect(within(item("Русский")).getByText("Русский")).toHaveAttribute("lang", "ru");
    expect(within(item("English")).getByText("English")).toHaveAttribute("lang", "en");
  });

  it("moves focus with the arrow keys (wrapping), Home and End; Escape closes and refocuses the trigger", () => {
    renderSwitcher();
    trigger().focus();
    press("ArrowDown");
    expect(item("Oʻzbekcha")).toHaveFocus();
    press("ArrowDown");
    expect(item("Русский")).toHaveFocus();
    press("End");
    expect(item("English")).toHaveFocus();
    press("ArrowDown");
    expect(item("Oʻzbekcha")).toHaveFocus();
    press("ArrowUp");
    expect(item("English")).toHaveFocus();
    press("Home");
    expect(item("Oʻzbekcha")).toHaveFocus();

    press("Escape");
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(replace).not.toHaveBeenCalled();
  });

  it("opens with ArrowUp on the last option, and with Enter or Space on the checked one", () => {
    renderSwitcher("ru");
    trigger().focus();
    press("ArrowUp");
    expect(item("English")).toHaveFocus();
    press("Escape");

    press("Enter");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(item("Русский")).toHaveFocus();
    press("Escape");

    press(" ");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(item("Русский")).toHaveFocus();
  });

  it("switches language with Enter and stays on the same route", () => {
    renderSwitcher();
    trigger().focus();
    press("ArrowDown");
    press("ArrowDown");
    press("Enter");
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/kurslar/dasturlash", { locale: "ru" });
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
  });

  it("selects with Space and with a click; choosing the current language does not navigate", () => {
    renderSwitcher();
    fireEvent.click(trigger());
    press(" ");
    expect(replace).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger());
    fireEvent.click(item("English"));
    expect(replace).toHaveBeenCalledWith("/kurslar/dasturlash", { locale: "en" });
  });

  it("closes on Tab and on a press outside, then unmounts the menu", async () => {
    renderSwitcher();
    fireEvent.click(trigger());
    press("Tab");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());

    fireEvent.click(trigger());
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("keeps Escape inside the menu so a surrounding drawer stays open", () => {
    const onWindowKeyDown = vi.fn();
    window.addEventListener("keydown", onWindowKeyDown);
    try {
      renderSwitcher();
      fireEvent.click(trigger());
      press("Escape");
      expect(onWindowKeyDown).not.toHaveBeenCalled();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    } finally {
      window.removeEventListener("keydown", onWindowKeyDown);
    }
  });

  it("keeps <html lang> in sync with the active locale", () => {
    document.documentElement.lang = "uz";
    renderSwitcher("ru");
    expect(document.documentElement.lang).toBe("ru");
  });
});
