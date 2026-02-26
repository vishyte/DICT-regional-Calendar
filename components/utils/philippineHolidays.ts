export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: "regular" | "special" | "provincial";
}

// Philippine National Holidays for 2026
export const philippineHolidays: Holiday[] = [
  // Regular holidays
  { date: "2026-01-01", name: "New Year's Day", type: "regular" },
  { date: "2026-02-10", name: "Feast of Our Lady of Lourdes", type: "regular" },
  { date: "2026-02-25", name: "EDSA Revolution Anniversary", type: "regular" },
  { date: "2026-04-09", name: "Araw ng Kagitingan", type: "regular" },
  { date: "2026-04-17", name: "Good Friday", type: "regular" },
  { date: "2026-04-18", name: "Black Saturday", type: "regular" },
  { date: "2026-04-19", name: "Easter Sunday", type: "regular" },
  { date: "2026-04-20", name: "Easter Monday", type: "regular" },
  { date: "2026-06-12", name: "Independence Day", type: "regular" },
  { date: "2026-06-24", name: "St. John the Baptist Day (Ber. of ASEAN)", type: "special" },
  { date: "2026-08-21", name: "Ninoy Aquino Day", type: "regular" },
  { date: "2026-11-01", name: "All Saints' Day", type: "regular" },
  { date: "2026-11-30", name: "Bonifacio Day", type: "regular" },
  { date: "2026-12-08", name: "Feast of the Immaculate Conception", type: "regular" },
  { date: "2026-12-25", name: "Christmas Day", type: "regular" },
  { date: "2026-12-26", name: "Additional Special Holiday", type: "special" },
  { date: "2026-12-30", name: "Rizal Day", type: "regular" },
  { date: "2026-12-31", name: "New Year's Eve", type: "special" },

  // Special non-working holidays
  { date: "2026-02-09", name: "Malasakit Day", type: "special" },
  { date: "2026-05-01", name: "Labor Day", type: "regular" },

  // Provincial holidays - Davao Region
  { date: "2026-12-15", name: "Sinulog Festival (Cebu)", type: "provincial" },
  { date: "2026-06-29", name: "Feast of St. Peter and St. Paul", type: "regular" },
];

export function isPhilippineHoliday(dateString: string): Holiday | null {
  return philippineHolidays.find(holiday => holiday.date === dateString) || null;
}

export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  const monthStr = String(month).padStart(2, "0");
  return philippineHolidays.filter(holiday => {
    const [holidayYear, holidayMonth] = holiday.date.split("-");
    return holidayYear === year.toString() && holidayMonth === monthStr;
  });
}

export function getHolidayColor(holidayType: string): string {
  switch (holidayType) {
    case "regular":
      return "bg-red-50 border-red-200";
    case "special":
      return "bg-orange-50 border-orange-200";
    case "provincial":
      return "bg-yellow-50 border-yellow-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

export function getHolidayBadgeColor(holidayType: string): string {
  switch (holidayType) {
    case "regular":
      return "bg-red-100 text-red-800";
    case "special":
      return "bg-orange-100 text-orange-800";
    case "provincial":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
