"use client";

import { ExternalLink, Send, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadStatus, Role } from "@prisma/client";
import type { getLead } from "@/server/modules/leads/service";
import { adminApi, errorMessage } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { DateText } from "@/components/admin/ui/date-text";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, LEAD_TYPE_LABELS, roleAtLeast } from "@/components/admin/labels";
import { Button } from "@/components/admin/ui/button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Select, Textarea } from "@/components/admin/ui/field";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { LEAD_STATUS_COLORS, LeadStatusBadge, LeadTypeBadge } from "@/components/admin/ui/status-badge";
import { useToast } from "@/components/admin/ui/toast";
import { LeadStatusSelect } from "./status-select";

export type LeadDetail = Awaited<ReturnType<typeof getLead>>;
type Note = LeadDetail["notes"][number];

export interface AssigneeOption {
  id: string;
  name: string;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5 text-sm">
      <dt className="t-meta pt-0.5 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </div>
  );
}

const STEPPER: LeadStatus[] = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED"];

export function LeadDetailView({ lead, role, assignees }: { lead: LeadDetail; role: Role; assignees: AssigneeOption[] | null }) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [assignee, setAssignee] = useState(lead.assignedToId ?? "");
  const [assigning, setAssigning] = useState(false);
  const [notes, setNotes] = useState<Note[]>(lead.notes);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const publicHref = lead.course ? `/kurslar/${lead.course.slug}` : lead.service ? `/media/xizmatlar/${lead.service.slug}` : null;
  const stepIndex = STEPPER.indexOf(status);

  const assign = async (id: string) => {
    const prev = assignee;
    setAssignee(id);
    setAssigning(true);
    try {
      await adminApi.patch(`/leads/${lead.id}`, { assignedToId: id || null });
      toast.success("Masʼul yangilandi");
      router.refresh();
    } catch (e) {
      setAssignee(prev);
      toast.error("Masʼulni oʻzgartirib boʻlmadi", errorMessage(e));
    } finally {
      setAssigning(false);
    }
  };

  const addNote = async () => {
    const text = note.trim();
    if (!text) return;
    setPosting(true);
    try {
      const { data } = await adminApi.post<Note>(`/leads/${lead.id}/notes`, { text });
      setNotes((n) => [{ ...data, createdAt: new Date(data.createdAt) }, ...n]);
      setNote("");
      toast.success("Izoh qoʻshildi");
      router.refresh();
    } catch (e) {
      toast.error("Izoh saqlanmadi", errorMessage(e));
    } finally {
      setPosting(false);
    }
  };

  const remove = async () => {
    try {
      await adminApi.delete(`/leads/${lead.id}`);
      toast.success("Lid oʻchirildi");
      router.push("/admin/leads");
      router.refresh();
    } catch (e) {
      toast.error("Oʻchirib boʻlmadi", errorMessage(e));
      setConfirmDelete(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        {/* Stepper */}
        <Card>
          <CardBody>
            <ol className="flex items-center gap-2" aria-label="Holat bosqichlari">
              {STEPPER.map((s, i) => {
                const done = stepIndex >= i && status !== "LOST";
                return (
                  <li key={s} className="flex flex-1 items-center gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", done ? "text-white" : "bg-paper-3 text-muted")} style={done ? { background: LEAD_STATUS_COLORS[s] } : undefined}>
                        {i + 1}
                      </span>
                      <span className={cn("truncate text-xs font-semibold", done ? "text-ink" : "text-muted")}>{LEAD_STATUS_LABELS[s]}</span>
                    </span>
                    {i < STEPPER.length - 1 ? <span aria-hidden className={cn("h-px flex-1", stepIndex > i && status !== "LOST" ? "bg-ink" : "bg-(--line-strong)")} /> : null}
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-(--line) pt-4">
              <span className="text-sm text-muted">Joriy holat:</span>
              {status === "LOST" ? <LeadStatusBadge status="LOST" /> : null}
              <LeadStatusSelect id={lead.id} status={status} size="md" onChanged={setStatus} />
              <span className="t-meta ml-auto text-muted">
                {lead.contactedAt ? (
                  <>
                    bogʻlanildi <DateText value={lead.contactedAt} />
                  </>
                ) : null}
                {lead.closedAt ? (
                  <>
                    {" · "}yopildi <DateText value={lead.closedAt} />
                  </>
                ) : null}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Fields */}
        <Card>
          <CardHeader title="Murojaat maʼlumotlari" eyebrow={LEAD_TYPE_LABELS[lead.type]} actions={<LeadTypeBadge type={lead.type} />} />
          <CardBody>
            <dl className="divide-y divide-(--line)">
              <Row label="Ism">{lead.name}</Row>
              <Row label="Telefon">
                <a href={`tel:${lead.phone}`} className="font-mono text-ink hover:text-orange">
                  {lead.phone}
                </a>
              </Row>
              {lead.email ? (
                <Row label="Email">
                  <a href={`mailto:${lead.email}`} className="hover:text-orange">
                    {lead.email}
                  </a>
                </Row>
              ) : null}
              {lead.company ? <Row label="Kompaniya">{lead.company}</Row> : null}
              {lead.course ? (
                <Row label="Kurs">
                  <Link href={`/admin/courses/${lead.course.id}`} className="font-semibold hover:text-orange">
                    {lead.course.title}
                  </Link>
                </Row>
              ) : null}
              {lead.service ? (
                <Row label="Xizmat">
                  <Link href={`/admin/services/${lead.service.id}`} className="font-semibold hover:text-orange">
                    {lead.service.title}
                  </Link>
                </Row>
              ) : null}
              {lead.branch ? <Row label="Filial">{lead.branch.name}</Row> : null}
              {lead.interest ? <Row label="Qiziqish">{lead.interest}</Row> : null}
              {lead.budget ? <Row label="Byudjet">{lead.budget}</Row> : null}
              {lead.message ? (
                <Row label="Xabar">
                  <p className="whitespace-pre-wrap">{lead.message}</p>
                </Row>
              ) : null}
              <Row label="Manba">
                <span className="font-mono text-xs">{lead.source ?? "—"}</span>
              </Row>
              {lead.utm && typeof lead.utm === "object" && !Array.isArray(lead.utm) && Object.keys(lead.utm).length ? (
                <Row label="UTM">
                  <ul className="flex flex-wrap gap-1.5">
                    {Object.entries(lead.utm as Record<string, unknown>).map(([k, v]) => (
                      <li key={k} className="t-meta rounded-full border border-(--line) px-2 py-0.5 text-muted">
                        {k}={String(v)}
                      </li>
                    ))}
                  </ul>
                </Row>
              ) : null}
              <Row label="Yaratildi">
                <DateText value={lead.createdAt} className="font-mono text-xs" />
              </Row>
              <Row label="ID">
                <span className="font-mono text-xs text-muted">{lead.id}</span>
              </Row>
            </dl>
            {publicHref ? (
              <div className="mt-4 border-t border-(--line) pt-4">
                <Button href={publicHref} variant="outline" size="sm" icon={<ExternalLink />}>
                  Sahifani ochish
                </Button>
              </div>
            ) : null}
          </CardBody>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader title="Izohlar" description="Jamoa uchun ichki qaydlar" />
          <CardBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNote();
              }}
              className="space-y-2"
            >
              <Textarea label="Yangi izoh" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Qoʻngʻiroq natijasi, kelishuvlar…" className="min-h-20" />
              <div className="flex justify-end">
                <Button type="submit" size="sm" icon={<Send />} loading={posting} disabled={!note.trim()}>
                  Qoʻshish
                </Button>
              </div>
            </form>
            {notes.length ? (
              <ol className="mt-5 space-y-4 border-l border-(--line) pl-4">
                {notes.map((n) => (
                  <li key={n.id} className="relative">
                    <span aria-hidden className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-paper bg-orange" />
                    <p className="text-sm whitespace-pre-wrap text-ink">{n.text}</p>
                    <p className="t-meta mt-1 text-muted">
                      {n.author?.name ?? "Tizim"} · <DateText value={n.createdAt} />
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState compact title="Izohlar yoʻq" description="Birinchi izohni qoʻshing." />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Side panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader title="Masʼul xodim" />
          <CardBody>
            {assignees ? (
              <Select label="Biriktirish" value={assignee} onChange={(e) => assign(e.target.value)} disabled={assigning} options={assignees.map((a) => ({ value: a.id, label: a.name }))} placeholder="Biriktirilmagan" />
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink">
                <UserRound size={16} className="text-muted" aria-hidden />
                {lead.assignedTo?.name ?? <span className="text-muted">Biriktirilmagan</span>}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Holatlar" />
          <CardBody className="space-y-1.5">
            {LEAD_STATUS_ORDER.map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <LeadStatusBadge status={s} />
                {status === s ? <span className="t-meta text-orange">joriy</span> : null}
              </div>
            ))}
          </CardBody>
        </Card>

        {roleAtLeast(role, "SUPER_ADMIN") ? (
          <Card className="border-danger/20">
            <CardHeader title="Xavfli zona" description="Oʻchirilgan lidni tiklab boʻlmaydi." />
            <CardBody>
              <Button variant="danger" size="sm" icon={<Trash2 />} onClick={() => setConfirmDelete(true)}>
                Lidni oʻchirish
              </Button>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Lidni oʻchirasizmi?"
        description={`«${lead.name}» murojaati va barcha izohlar butunlay oʻchiriladi.`}
        confirmLabel="Oʻchirish"
        tone="danger"
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
