"use client"

import { Label, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { STORAGE_OTHER_COLOR, STORAGE_SEGMENT_COLORS } from "@/lib/constant"
import { formatBytes } from "@/lib/helper"

export interface StorageSlice {
  id: string
  name: string
  bytes: number
  percent: number
}

const colorOf = (id: string) => STORAGE_SEGMENT_COLORS[id] ?? STORAGE_OTHER_COLOR

export function StorageDonut({ slices, totalBytes }: { slices: StorageSlice[]; totalBytes: number }) {
  const config: ChartConfig = Object.fromEntries(slices.map((s) => [s.id, { label: s.name, color: colorOf(s.id) }]))
  const data = slices.map((s) => ({ id: s.id, name: s.name, bytes: s.bytes, fill: colorOf(s.id) }))
  const [size, unit] = formatBytes(totalBytes).split(" ")

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={config} className="mx-auto aspect-square size-[200px] flex-none">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value, name) => `${name} · ${formatBytes(Number(value))}`} />} />
          <Pie isAnimationActive={false} data={data} dataKey="bytes" nameKey="name" innerRadius="66%" outerRadius="100%" strokeWidth={2} stroke="var(--panel)">
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox && "cy" in viewBox ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 4} className="fill-ink font-mono text-[22px] font-medium">
                      {size}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 16} className="fill-faint text-[11px]">
                      {unit} total
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-col gap-1.5">
        {slices.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-[12px] text-mute">
            <span className="size-2 flex-none rounded-full" style={{ background: colorOf(s.id) }} />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="font-mono text-faint">{formatBytes(s.bytes)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
