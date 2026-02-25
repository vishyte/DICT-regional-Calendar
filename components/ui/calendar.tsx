"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 bg-white rounded-lg shadow-md border border-gray-100",
        className
      )}
      classNames={{
        months: "",
        month: "",
        caption: "",
        caption_label: "",
        nav: "",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "rdp-nav_button"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "",
        head_row: "",
        head_cell: "",
        row: "",
        cell: "",
        day: "rdp-day",
        day_range_start: "rdp-day_range_start",
        day_range_end: "rdp-day_range_end",
        day_selected: "rdp-day_selected",
        day_today: "rdp-day_today",
        day_outside: "rdp-day_outside",
        day_disabled: "rdp-day_disabled",
        day_range_middle: "rdp-day_range_middle",
        day_hidden: "rdp-day_hidden",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }: any) => (
          <ChevronLeft className={cn("h-5 w-5", className)} {...props} />
        ),
        IconRight: ({ className, ...props }: any) => (
          <ChevronRight className={cn("h-5 w-5", className)} {...props} />
        ),
      } as any}
      {...props}
    />
  );
}

export { Calendar };