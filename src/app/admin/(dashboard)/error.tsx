"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/admin/ui/error-state";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorState description="Sahifani yuklashda xatolik yuz berdi. Qayta urinib koʻring yoki keyinroq qaytib keling." digest={error.digest} onRetry={reset} />;
}
