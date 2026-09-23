import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredFile {
  key: string;
  url: string;
}

/**
 * Storage abstraction. `LocalStorageProvider` writes under UPLOAD_DIR (a Docker volume).
 * Implement this interface (e.g. S3/R2) and swap it in `storage()` to migrate to the cloud.
 */
export interface StorageProvider {
  put(key: string, data: Buffer, contentType: string): Promise<StoredFile>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  constructor(
    private readonly rootDir: string,
    private readonly publicPath: string,
  ) {}

  private resolve(key: string) {
    const safe = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    const full = path.resolve(this.rootDir, safe);
    if (!full.startsWith(path.resolve(this.rootDir))) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, data: Buffer): Promise<StoredFile> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return { key, url: this.publicUrl(key) };
  }

  async remove(key: string) {
    await unlink(this.resolve(key)).catch(() => undefined);
  }

  publicUrl(key: string) {
    return `${this.publicPath.replace(/\/$/, "")}/${key}`;
  }
}
