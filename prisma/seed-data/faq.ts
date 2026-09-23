import type { Prisma } from "@prisma/client";

export const faqs: Prisma.FaqCreateInput[] = [
  { question: "Kurslarga qanday yoziladi?", answer: "Saytdagi “Kursga yozilish” tugmasi orqali ariza qoldiring — biz siz bilan bogʻlanib, bepul konsultatsiya oʻtkazamiz va guruhga yozamiz.", scope: "EDU", order: 0, status: "PUBLISHED" },
  { question: "Oldindan bilim kerakmi?", answer: "Koʻpchilik kurslar noldan boshlanadi. Har bir kurs sahifasida “Kimlar uchun” boʻlimida talablar koʻrsatilgan.", scope: "EDU", order: 1, status: "PUBLISHED" },
  { question: "Darslar qanday formatda oʻtadi?", answer: "Asosan offlayn, Namangan shahridagi oʻquv markazimizda. Baʼzi kurslar gibrid formatda — offlayn va onlayn darslar aralash.", scope: "EDU", order: 2, status: "PUBLISHED" },
  { question: "Kurs yakunida sertifikat beriladimi?", answer: "Ha. Kursni muvaffaqiyatli tugatgan va diplom loyihasini himoya qilgan oʻquvchilarga EduTech sertifikati beriladi.", scope: "EDU", order: 3, status: "PUBLISHED" },
  { question: "Media xizmatlar narxi qanday shakllanadi?", answer: "Har bir loyiha alohida hisoblanadi: format, hajm va muddatga qarab. Ariza qoldiring — 24 soat ichida taklif yuboramiz.", scope: "MEDIA", order: 4, status: "PUBLISHED" },
  { question: "Kichik biznes bilan ishlaysizmi?", answer: "Albatta. Bizda kichik biznes uchun boshlangʻich paketlardan tortib, yirik brendlar uchun toʻliq prodakshngacha yechimlar bor.", scope: "MEDIA", order: 5, status: "PUBLISHED" },
];
