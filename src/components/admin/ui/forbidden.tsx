import { Lock } from "lucide-react";
import { Button } from "./button";

export function Forbidden({ description = "Bu boʻlimga kirish uchun huquqingiz yetarli emas." }: { description?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <span className="grid size-14 place-items-center rounded-full bg-paper-3 text-muted" aria-hidden>
        <Lock size={24} />
      </span>
      <p className="t-eyebrow mt-6 text-orange">403</p>
      <h1 className="t-h3 mt-2">Ruxsat yoʻq</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      <Button href="/admin" variant="outline" size="sm" className="mt-6">
        Boshqaruv paneliga qaytish
      </Button>
    </div>
  );
}
