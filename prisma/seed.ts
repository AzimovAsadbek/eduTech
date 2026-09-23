/* eslint-disable no-console */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { categories, courses } from "./seed-data/courses";
import { services } from "./seed-data/services";
import { faqs } from "./seed-data/faq";

const db = new PrismaClient();
const DEMO = process.env.SEED_DEMO === "1";

async function main() {
  // ── Super admin ───────────────────────────────────────────────
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@edutech.uz").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  await db.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, name: process.env.SEED_ADMIN_NAME ?? "EduTech Admin", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`✔ admin ${email}`);

  // ── Settings & branch (placeholders — fill real data in /admin/settings) ──
  await db.siteSetting.upsert({
    where: { key: "site" },
    update: {},
    create: {
      key: "site",
      value: {
        brandName: "EduTech",
        tagline: "Zamonaviy kasblar akademiyasi",
        city: "Namangan",
        address: "",
        phone: "",
        telegram: "",
        instagram: "",
        workingHours: "Du–Sh 09:00–19:00",
        stats: { students: "500+", courses: "9+", projects: "100+" },
        telegramNotifications: true,
      },
    },
  });
  const branchCount = await db.branch.count();
  if (branchCount === 0) {
    await db.branch.create({ data: { name: "Namangan, asosiy filial", address: "Manzil admin paneldan kiritiladi", workingHours: "Du–Sh 09:00–19:00", order: 0 } });
  }
  console.log("✔ settings & branch");

  // ── Courses ───────────────────────────────────────────────────
  for (const c of categories) await db.courseCategory.upsert({ where: { slug: c.slug }, update: { name: c.name, order: c.order }, create: c });
  const cats = await db.courseCategory.findMany();
  for (const { category, ...course } of courses) {
    const categoryId = cats.find((c) => c.slug === category)?.id ?? null;
    await db.course.upsert({ where: { slug: course.slug }, update: {}, create: { ...course, categoryId } });
  }
  console.log(`✔ ${courses.length} courses`);

  // ── Services ──────────────────────────────────────────────────
  for (const s of services) await db.service.upsert({ where: { slug: s.slug }, update: {}, create: s });
  console.log(`✔ ${services.length} services`);

  // ── FAQ ───────────────────────────────────────────────────────
  if ((await db.faq.count()) === 0) {
    for (const f of faqs) await db.faq.create({ data: f });
    console.log(`✔ ${faqs.length} faqs`);
  }

  // ── Demo placeholders (SEED_DEMO=1) — clearly labelled, never real people ──
  if (DEMO) await seedDemo();
}

async function seedDemo() {
  const course = await db.course.findUnique({ where: { slug: "dasturlash" } });
  const service = await db.service.findUnique({ where: { slug: "reels-production" } });
  const teacher = await db.teacher.upsert({
    where: { slug: "namuna-mentor" },
    update: {},
    create: { slug: "namuna-mentor", name: "Namuna Mentor", title: "Senior Engineer (namuna)", bio: "Bu namunaviy yozuv. Admin paneldan real oʻqituvchi maʼlumotlarini kiriting.", status: "PUBLISHED" },
  });
  if (course) await db.courseTeacher.upsert({ where: { courseId_teacherId: { courseId: course.id, teacherId: teacher.id } }, update: {}, create: { courseId: course.id, teacherId: teacher.id } });
  if ((await db.testimonial.count()) === 0) {
    await db.testimonial.createMany({
      data: [1, 2, 3].map((i) => ({
        name: `Namuna oʻquvchi ${i}`,
        role: "Dasturlash kursi bitiruvchisi (namuna)",
        courseId: course?.id,
        quote: "Bu namunaviy fikr. Real oʻquvchi fikrlari admin paneldan qoʻshiladi.",
        resultLabel: "Namuna natija",
        status: "PUBLISHED",
        order: i,
      })),
    });
  }
  if ((await db.result.count()) === 0) {
    await db.result.createMany({
      data: [
        { kind: "CAREER", title: "Namuna: ishga joylashdi", studentName: "Namuna oʻquvchi", courseId: course?.id, metricLabel: "Junior Developer", status: "PUBLISHED", order: 0 },
        { kind: "PROJECT", title: "Namuna: diplom loyihasi", studentName: "Namuna oʻquvchi", courseId: course?.id, metricLabel: "Web ilova", status: "PUBLISHED", order: 1 },
        { kind: "GROWTH", title: "Namuna: Instagram oʻsishi", metricLabel: "+10 000 obunachi", status: "PUBLISHED", order: 2 },
      ],
    });
  }
  if ((await db.mediaProject.count()) === 0) {
    await db.mediaProject.createMany({
      data: [1, 2, 3, 4].map((i) => ({
        slug: `namuna-loyiha-${i}`,
        title: `Namuna loyiha ${i}`,
        client: "Namuna mijoz",
        serviceId: service?.id,
        category: i % 2 ? "Reels" : "Video",
        description: "Bu namunaviy loyiha. Real keys-stadi admin paneldan qoʻshiladi.",
        challenge: "Namuna muammo.",
        solution: "Namuna yechim.",
        results: "Namuna natija.",
        tags: ["namuna"],
        images: [],
        status: "PUBLISHED",
        featured: i === 1,
        order: i,
      })),
    });
  }
  console.log("✔ demo placeholders");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
