import { EmptyState } from "@/components/admin/ui/empty-state";
import { Button } from "@/components/admin/ui/button";
import { SearchX } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <EmptyState icon={<SearchX />} title="Sahifa topilmadi" description="Havola eskirgan yoki element oʻchirilgan boʻlishi mumkin." action={<Button href="/admin" variant="outline" size="sm">Boshqaruv paneliga qaytish</Button>} />
    </div>
  );
}
