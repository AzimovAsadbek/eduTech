// Minimal stub for `next/cache` used by server modules under Vitest.
type AnyFn = (...args: unknown[]) => unknown;
export const unstable_cache = <F extends AnyFn>(fn: F): F => fn;
export const revalidateTag = (..._args: unknown[]): void => void _args;
export const revalidatePath = (..._args: unknown[]): void => void _args;
export const cacheTag = (..._args: unknown[]): void => void _args;
export const cacheLife = (..._args: unknown[]): void => void _args;
