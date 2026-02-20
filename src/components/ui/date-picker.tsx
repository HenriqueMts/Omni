"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR as ptBRDateFns } from "date-fns/locale";
import { ptBR } from "react-day-picker/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = Readonly<{
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Hidden input name for form submit (value as YYYY-MM-DD) */
  name?: string;
}>;

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione a data",
  className,
  disabled,
  name,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value;

  return (
    <>
      {name && date && (
        <input type="hidden" name={name} value={format(date, "yyyy-MM-dd")} />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            data-empty={!date}
            className={cn(
              "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
              "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: ptBRDateFns }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-zinc-800 bg-zinc-900" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              onChange?.(d);
              setOpen(false);
            }}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}

export type DateRange = { from: Date | undefined; to?: Date | undefined };

type DateRangePickerProps = Readonly<{
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Hidden input names for form submit (dateFrom, dateTo as YYYY-MM-DD) */
  dateFromName?: string;
  dateToName?: string;
}>;

function getRangeLabel(range: DateRange | undefined, placeholder: string): string {
  if (!range?.from) return placeholder;
  const fromStr = format(range.from, "dd/MM/yyyy", { locale: ptBRDateFns });
  if (!range.to) return fromStr;
  return `${fromStr} – ${format(range.to, "dd/MM/yyyy", { locale: ptBRDateFns })}`;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Selecione o período",
  className,
  disabled,
  dateFromName,
  dateToName,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const range = value;

  const fromStr = range?.from ? format(range.from, "yyyy-MM-dd") : "";
  const toStr = range?.to ? format(range.to, "yyyy-MM-dd") : "";
  const label = getRangeLabel(range, placeholder);

  return (
    <>
      {dateFromName && fromStr && <input type="hidden" name={dateFromName} value={fromStr} />}
      {dateToName && toStr && <input type="hidden" name={dateToName} value={toStr} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            data-empty={!range?.from}
            className={cn(
              "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
              "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-zinc-800 bg-zinc-900" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={onChange}
            locale={ptBR}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
