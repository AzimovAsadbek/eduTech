// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadForm } from "@/components/site/lead-form";

const courses = [
  { value: "dasturlash", label: "Dasturlash" },
  { value: "smm", label: "SMM" },
];
const services = [{ value: "reels-production", label: "Reels Production" }];
const branches = [
  { value: "b1", label: "Markaz" },
  { value: "b2", label: "Yangi shahar" },
];

/** Minimal user-event replacement (the package is not installed): typing goes through React's change handler. */
const user = {
  async type(el: HTMLElement, value: string) {
    fireEvent.focus(el); // real users focus before typing; the form stamps `startedAt` on first focus
    fireEvent.input(el, { target: { value } });
    fireEvent.change(el, { target: { value } });
  },
  async click(el: HTMLElement) {
    fireEvent.click(el);
  },
};

function mockFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fn = vi.fn(async () => ({ ok: init.ok ?? true, status: init.status ?? 201, json: async () => body }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("<LeadForm />", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders EDUCATION fields: name, phone, course select, branch select (when >1) and honeypot", () => {
    render(<LeadForm type="EDUCATION" courses={courses} branches={branches} submitLabel="Ariza yuborish" />);
    expect(screen.getByLabelText(/Ismingiz/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefon/)).toBeInTheDocument();
    expect(screen.getByLabelText("Qiziqqan kurs")).toBeInTheDocument();
    expect(screen.getByLabelText("Filial")).toBeInTheDocument();
    expect(screen.getByLabelText("Xabar")).toBeInTheDocument();
    expect(screen.queryByLabelText("Kompaniya / brend")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Qiziqish")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ariza yuborish/ })).toBeInTheDocument();
    const honeypot = document.querySelector<HTMLInputElement>("input[name=website]");
    expect(honeypot).not.toBeNull();
    expect(honeypot!.tabIndex).toBe(-1);
  });

  it("hides the branch select when only one branch exists and preselects the default course", () => {
    render(<LeadForm type="EDUCATION" courses={courses} branches={[branches[0]]} defaultCourseSlug="smm" />);
    expect(screen.queryByLabelText("Filial")).not.toBeInTheDocument();
    expect((screen.getByLabelText("Qiziqqan kurs") as HTMLSelectElement).value).toBe("smm");
  });

  it("renders MEDIA fields: company, service, budget", () => {
    render(<LeadForm type="MEDIA" services={services} submitLabel="Soʻrov yuborish" />);
    expect(screen.getByLabelText("Kompaniya / brend")).toBeInTheDocument();
    expect(screen.getByLabelText("Xizmat")).toBeInTheDocument();
    expect(screen.getByLabelText("Taxminiy byudjet")).toBeInTheDocument();
    expect(screen.queryByLabelText("Qiziqqan kurs")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Soʻrov yuborish/ })).toBeInTheDocument();
  });

  it("renders GENERAL fields: interest select and default 'Yuborish' label", () => {
    render(<LeadForm type="GENERAL" />);
    expect(screen.getByLabelText("Qiziqish")).toBeInTheDocument();
    expect(screen.queryByLabelText("Xizmat")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Yuborish/ })).toBeInTheDocument();
  });

  it("shows validation errors on empty submit and does not call fetch", async () => {
    const fetchSpy = mockFetch({ ok: true });
    render(<LeadForm type="GENERAL" />);
    await user.click(screen.getByRole("button", { name: /Yuborish/ }));
    const alerts = await screen.findAllByRole("alert");
    const texts = alerts.map((a) => a.textContent);
    expect(texts).toContain("Ismingizni kiriting");
    expect(texts).toContain("Telefon raqamni kiriting");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Ismingiz/)).toHaveAttribute("aria-invalid", "true");
  });

  it("rejects a non-numeric phone client-side", async () => {
    const fetchSpy = mockFetch({ ok: true });
    render(<LeadForm type="GENERAL" />);
    await user.type(screen.getByLabelText(/Ismingiz/), "Ali Valiyev");
    await user.type(screen.getByLabelText(/Telefon/), "abcdefgh");
    await user.click(screen.getByRole("button", { name: /Yuborish/ }));
    expect(await screen.findByText("Faqat raqamlar")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts JSON to /api/v1/public/leads and shows the success state", async () => {
    const fetchSpy = mockFetch({ ok: true, data: { id: "x" } });
    render(<LeadForm type="EDUCATION" courses={courses} branches={branches} defaultCourseSlug="dasturlash" source="course:dasturlash" submitLabel="Ariza yuborish" />);
    await user.type(screen.getByLabelText(/Ismingiz/), "E2E Test");
    await user.type(screen.getByLabelText(/Telefon/), "+998901234567");
    await user.click(screen.getByRole("button", { name: /Ariza yuborish/ }));

    expect(await screen.findByRole("heading", { name: "Arizangiz qabul qilindi" })).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/public/leads");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ type: "EDUCATION", name: "E2E Test", phone: "+998901234567", courseSlug: "dasturlash", branchId: "b1", source: "course:dasturlash" });
    expect(typeof body.startedAt).toBe("number");
    // empty strings (including the honeypot) are stripped from the payload
    expect(body).not.toHaveProperty("website");
    expect(body).not.toHaveProperty("message");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(window.dataLayer?.some((e) => (e as { event: string }).event === "application_submit")).toBe(true);
  });

  it("still submits when no field ever received focus (hidden startedAt is NaN)", async () => {
    const fetchSpy = mockFetch({ ok: true, data: { id: "x" } });
    render(<LeadForm type="GENERAL" />);
    fireEvent.change(screen.getByLabelText(/Ismingiz/), { target: { value: "Ali Valiyev" } });
    fireEvent.change(screen.getByLabelText(/Telefon/), { target: { value: "1234567" } });
    fireEvent.click(screen.getByRole("button", { name: /Yuborish/ }));
    expect(await screen.findByRole("heading", { name: "Arizangiz qabul qilindi" })).toBeInTheDocument();
    const body = JSON.parse(String((fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body).not.toHaveProperty("startedAt");
  });

  it("surfaces the first server validation detail as an error message", async () => {
    mockFetch({ ok: false, error: { code: "validation_error", message: "Maʼlumotlar notoʻgʻri", details: [{ path: "phone", message: "Telefon raqam notoʻgʻri" }] } }, { ok: false, status: 422 });
    render(<LeadForm type="GENERAL" />);
    await user.type(screen.getByLabelText(/Ismingiz/), "Ali Valiyev");
    await user.type(screen.getByLabelText(/Telefon/), "1234567");
    await user.click(screen.getByRole("button", { name: /Yuborish/ }));
    expect(await screen.findByText("Telefon raqam notoʻgʻri")).toBeInTheDocument();
    expect(screen.queryByText("Arizangiz qabul qilindi")).not.toBeInTheDocument();
  });

  it("shows a network error message when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    render(<LeadForm type="GENERAL" />);
    await user.type(screen.getByLabelText(/Ismingiz/), "Ali Valiyev");
    await user.type(screen.getByLabelText(/Telefon/), "1234567");
    await user.click(screen.getByRole("button", { name: /Yuborish/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Tarmoq xatosi"));
  });
});
