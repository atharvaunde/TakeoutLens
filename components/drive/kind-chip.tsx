import { getKindFamily } from "@/lib/helper"
import { cn } from "@/lib/utils"

/** Small mono chip: DIR / HTML / PDF / MP4 ... coloured by kind family. */
export function KindChip({ label, className }: { label: string; className?: string }) {
  const family = getKindFamily(label)
  return (
    <span
      className={cn("inline-block rounded-[3px] py-px text-center font-mono font-semibold tracking-[.04em]", className)}
      style={{ backgroundColor: `var(--k-${family}-bg)`, color: `var(--k-${family}-fg)` }}
    >
      {label}
    </span>
  )
}
