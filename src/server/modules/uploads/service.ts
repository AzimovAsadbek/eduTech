import "server-only";
import { randomBytes } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import { db } from "@/server/db";
import { env } from "@/lib/env";
import { badRequest } from "@/server/http/errors";
import { audit } from "@/server/modules/audit/service";
import { LocalStorageProvider, type StorageProvider } from "./storage";

const ALLOWED = new Set(["jpeg", "png", "webp", "gif", "avif"]);
const MAX_DIMENSION = 2400;

let provider: StorageProvider | null = null;
export function storage(): StorageProvider {
  return (provider ??= new LocalStorageProvider(env().UPLOAD_DIR, env().UPLOAD_PUBLIC_PATH));
}

/**
 * Validates by decoding the image (magic bytes, not the declared mime),
 * strips metadata, resizes down and re-encodes to WebP — so nothing user-supplied is served verbatim.
 */
export async function uploadImage(file: File, actorId: string, alt?: string) {
  const maxBytes = env().UPLOAD_MAX_MB * 1024 * 1024;
  if (file.size > maxBytes) throw badRequest(`Fayl hajmi ${env().UPLOAD_MAX_MB} MB dan oshmasligi kerak`);

  const input = Buffer.from(await file.arrayBuffer());
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw badRequest("Fayl rasm emas");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) throw badRequest("Faqat JPEG, PNG, WebP, GIF yoki AVIF");

  const pipeline = sharp(input, { animated: meta.format === "gif" })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });
  const output = await pipeline.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });

  const now = new Date();
  const key = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${randomBytes(12).toString("hex")}.webp`;
  const stored = await storage().put(key, output.data, "image/webp");

  const upload = await db.upload.create({
    data: {
      key: stored.key,
      url: stored.url,
      mimeType: "image/webp",
      size: output.info.size,
      width: output.info.width,
      height: output.info.height,
      alt: alt?.slice(0, 200),
      createdById: actorId,
    },
  });
  await audit({ userId: actorId, action: "UPLOAD", entity: "Upload", entityId: upload.id, meta: { size: upload.size } });
  return upload;
}

export async function listUploads(page = 1, pageSize = 40) {
  const [items, total] = await Promise.all([
    db.upload.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.upload.count(),
  ]);
  return { items, total, page, pageSize };
}

export async function deleteUpload(id: string, actorId: string) {
  const upload = await db.upload.delete({ where: { id } });
  await storage().remove(upload.key);
  await audit({ userId: actorId, action: "DELETE", entity: "Upload", entityId: id });
}
