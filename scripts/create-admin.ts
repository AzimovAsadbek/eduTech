/* eslint-disable no-console */
/**
 * Creates or resets an admin user without the UI.
 *   npx tsx scripts/create-admin.ts email@x.uz "Strong Passw0rd" "Full Name" [SUPER_ADMIN|ADMIN|EDITOR]
 */
import "dotenv/config";
import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const [email, password, name = "Admin", role = "ADMIN"] = process.argv.slice(2);
if (!email || !password) throw new Error("usage: create-admin.ts <email> <password> [name] [role]");

const db = new PrismaClient();
const passwordHash = await bcrypt.hash(password, 12);
const user = await db.adminUser.upsert({
  where: { email: email.toLowerCase() },
  update: { passwordHash, name, role: role as Role, isActive: true, failedLoginAttempts: 0, lockedUntil: null },
  create: { email: email.toLowerCase(), passwordHash, name, role: role as Role },
});
console.log(`✔ ${user.email} (${user.role})`);
await db.$disconnect();
