import type { Prisma } from "@prisma/client";

/** `translations` holds ru/en copies of question + answer. */
export const faqs: Prisma.FaqCreateInput[] = [
  {
    question: "Kurslarga qanday yoziladi?",
    answer: "Saytdagi “Kursga yozilish” tugmasi orqali ariza qoldiring — biz siz bilan bogʻlanib, bepul konsultatsiya oʻtkazamiz va guruhga yozamiz.",
    scope: "EDU",
    order: 0,
    status: "PUBLISHED",
    translations: {
      ru: {
        question: "Как записаться на курс?",
        answer: "Оставьте заявку через кнопку «Записаться на курс» на сайте — мы свяжемся с вами, проведём бесплатную консультацию и запишем в группу.",
      },
      en: {
        question: "How do I enroll in a course?",
        answer: "Leave a request via the “Enroll in a course” button on the website — we will contact you, hold a free consultation and add you to a group.",
      },
    },
  },
  {
    question: "Oldindan bilim kerakmi?",
    answer: "Koʻpchilik kurslar noldan boshlanadi. Har bir kurs sahifasida “Kimlar uchun” boʻlimida talablar koʻrsatilgan.",
    scope: "EDU",
    order: 1,
    status: "PUBLISHED",
    translations: {
      ru: {
        question: "Нужны ли предварительные знания?",
        answer: "Большинство курсов начинаются с нуля. Требования указаны на странице каждого курса в разделе «Для кого».",
      },
      en: {
        question: "Do I need prior knowledge?",
        answer: "Most courses start from scratch. Requirements are listed in the “Who it's for” section on each course page.",
      },
    },
  },
  {
    question: "Darslar qanday formatda oʻtadi?",
    answer: "Asosan offlayn, Namangan shahridagi oʻquv markazimizda. Baʼzi kurslar gibrid formatda — offlayn va onlayn darslar aralash.",
    scope: "EDU",
    order: 2,
    status: "PUBLISHED",
    translations: {
      ru: {
        question: "В каком формате проходят занятия?",
        answer: "В основном офлайн, в нашем учебном центре в городе Наманган. Некоторые курсы проходят в гибридном формате — офлайн- и онлайн-занятия чередуются.",
      },
      en: {
        question: "What format are the classes in?",
        answer: "Mostly offline, at our learning center in Namangan. Some courses run in a hybrid format — a mix of offline and online classes.",
      },
    },
  },
  {
    question: "Kurs yakunida sertifikat beriladimi?",
    answer: "Ha. Kursni muvaffaqiyatli tugatgan va diplom loyihasini himoya qilgan oʻquvchilarga EduTech sertifikati beriladi.",
    scope: "EDU",
    order: 3,
    status: "PUBLISHED",
    translations: {
      ru: {
        question: "Выдаётся ли сертификат по окончании курса?",
        answer: "Да. Студенты, успешно завершившие курс и защитившие дипломный проект, получают сертификат EduTech.",
      },
      en: {
        question: "Do I get a certificate at the end of the course?",
        answer: "Yes. Students who successfully complete the course and defend their capstone project receive an EduTech certificate.",
      },
    },
  },
  {
    question: "Media xizmatlar narxi qanday shakllanadi?",
    answer: "Har bir loyiha alohida hisoblanadi: format, hajm va muddatga qarab. Ariza qoldiring — 24 soat ichida taklif yuboramiz.",
    scope: "MEDIA",
    order: 4,
    status: "PUBLISHED",
    translations: {
      ru: {
        question: "Как формируется стоимость медиауслуг?",
        answer: "Каждый проект рассчитывается индивидуально — в зависимости от формата, объёма и сроков. Оставьте заявку — в течение 24 часов мы отправим предложение.",
      },
      en: {
        question: "How is the price of media services determined?",
        answer: "Every project is quoted individually, based on format, scope and timeline. Leave a request — we will send you a proposal within 24 hours.",
      },
    },
  },
  {
    question: "Kichik biznes bilan ishlaysizmi?",
    answer: "Albatta. Bizda kichik biznes uchun boshlangʻich paketlardan tortib, yirik brendlar uchun toʻliq prodakshngacha yechimlar bor.",
    scope: "MEDIA",
    order: 5,
    status: "PUBLISHED",
    translations: {
      ru: {
        question: "Вы работаете с малым бизнесом?",
        answer: "Конечно. У нас есть решения от стартовых пакетов для малого бизнеса до полного продакшна для крупных брендов.",
      },
      en: {
        question: "Do you work with small businesses?",
        answer: "Absolutely. We offer everything from starter packages for small businesses to full-scale production for major brands.",
      },
    },
  },
];
