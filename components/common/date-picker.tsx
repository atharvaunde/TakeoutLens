"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDate } from "@/lib/helper"

interface DatePickerProps {
  /** Selected date as a UTC-midnight timestamp. */
  value: number | null
  onChange: (utcMidnight: number) => void
  placeholder?: string
  /** Custom trigger (e.g. a page title); defaults to an outlined button showing the date. */
  children?: React.ReactNode
}

/** Single-date picker (Popover + Calendar). Dates are UTC-midnight timestamps so they match wall-clock math. */
export function DatePicker({ value, onChange, placeholder = "Pick a date", children }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value === null ? undefined : new Date(value + new Date(value).getTimezoneOffset() * 60_000)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <CalendarIcon data-icon="inline-start" />
            {value === null ? placeholder : formatDate(value, { timeZone: "UTC" })}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
