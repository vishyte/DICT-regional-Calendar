import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Activity = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  originalDate?: string;
  time: string;
  endTime: string;
  location: string;
  venue: string;
  sector: string;
  project: string;
  description?: string;
  participants?: number;
  facilitator?: string;
  status: "Scheduled" | "Completed" | "Postponed" | "Cancelled";
  changeReason?: string;
  changeDate?: string;
};

export type DayActivities = Record<string, Activity[]>;

type ActivitiesContextType = {
  activities: DayActivities;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updater: (a: Activity) => Activity) => void;
};

const STORAGE_KEY = "dict_calendar_activities";

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

// Seed with a couple of example activities (matches calendar demo)
const SEED: DayActivities = {
  "2025-10-28": [
    {
      id: "1",
      name: "Free Wi-Fi Installation Training",
      date: "2025-10-28",
      time: "9:00 AM",
      endTime: "12:00 PM",
      location: "Davao City",
      venue: "DICT Regional Office Conference Hall",
      sector: "LGU",
      project: "IIDB Free Wi-Fi for All",
      description:
        "Comprehensive training on the installation and maintenance of free Wi-Fi infrastructure for local government units.",
      participants: 45,
      facilitator: "Engr. Juan Dela Cruz",
      status: "Scheduled",
    },
  ],
};

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<DayActivities>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return SEED;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch {}
  }, [activities]);

  // Auto-mark past scheduled activities as Completed (based on date only)
  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let changed = false;
    const next: DayActivities = {};
    for (const [dateKey, list] of Object.entries(activities)) {
      next[dateKey] = list.map(item => {
        if (item.status === "Scheduled" && dateKey < todayKey) {
          changed = true;
          return {
            ...item,
            status: "Completed",
            changeDate: item.changeDate ?? new Date().toISOString(),
          };
        }
        return item;
      });
    }
    if (changed) setActivities(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addActivity = (activity: Activity) => {
    setActivities(prev => {
      const next: DayActivities = { ...prev };
      if (!next[activity.date]) next[activity.date] = [];
      next[activity.date] = [...next[activity.date], activity];
      return next;
    });
  };

  const updateActivity = (id: string, updater: (a: Activity) => Activity) => {
    setActivities(prev => {
      const next: DayActivities = {};
      for (const [dateKey, items] of Object.entries(prev)) {
        next[dateKey] = items.map(a => (a.id === id ? updater(a) : a));
      }
      return next;
    });
  };

  const value = useMemo(() => ({ activities, addActivity, updateActivity }), [activities]);

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error("useActivities must be used within ActivitiesProvider");
  return ctx;
}


