/**
 * "500+" style label that counts up when it scrolls into view. Pure markup: the final value is rendered
 * on the server (so it is correct for crawlers, screen readers and visitors without JS); `MotionRuntime`
 * animates the number only for counters that start below the fold, then restores the exact text.
 */
export function Counter({ value, className }: { value: string; className?: string }) {
  const match = /^(\D*)(\d[\d\s]*)(.*)$/.exec(value);
  const num = match ? parseInt(match[2].replace(/\s/g, ""), 10) : NaN;
  if (!match || Number.isNaN(num)) return <span className={className}>{value}</span>;
  return (
    <span className={className} data-count={num} data-prefix={match[1]} data-suffix={match[3]}>
      {value}
    </span>
  );
}
