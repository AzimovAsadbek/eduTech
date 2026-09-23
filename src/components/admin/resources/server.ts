import "server-only";
import { listResource } from "@/server/modules/content/admin";
import { RELATION_LABEL_FIELD, relationKeysOf, RESOURCES, type Option, type RelationKey, type ResourceKey } from "./config";

/** Fetches select options for every relation field of a resource (server-side). */
export async function loadRelations(key: ResourceKey): Promise<Partial<Record<RelationKey, Option[]>>> {
  const keys = relationKeysOf(RESOURCES[key]);
  const entries = await Promise.all(
    keys.map(async (rel) => {
      const { items } = await listResource(rel, { page: 1, pageSize: 200 });
      const labelField = RELATION_LABEL_FIELD[rel];
      const options: Option[] = (items as Record<string, unknown>[]).map((i) => ({ value: String(i.id), label: String(i[labelField] ?? i.id) }));
      return [rel, options] as const;
    }),
  );
  return Object.fromEntries(entries);
}
