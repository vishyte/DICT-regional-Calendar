import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { activitiesAPI } from "../utils/api";
import { useAuth } from "./AuthContext";

export type Activity = {
  id: number;
  name: string;
  date: string; // YYYY-MM-DD
  originalDate?: string;
  time: string;
  endTime: string;
  location: string;
  venue: string;
  venueAddress?: string;
  sector: string;
  project: string;
  description?: string;
  participants?: number;
  facilitator?: string;
  status: "Scheduled" | "Completed" | "Postponed" | "Cancelled";
  changeReason?: string;
  changeDate?: string;
  createdBy?: {
    idNumber: string;
    fullName: string;
    email: string;
    project: string;
  };
  assignedPersonnel?: Array<{
    idNumber: string;
    fullName: string;
    task: string;
  }>;
  priority?: "Normal" | "Urgent";
  partnerInstitution?: string;
  documents?: Array<{
    id: number;
    name: string;
    url: string;
    uploadDate: string;
  }>;
  attendanceFile?: string;
  attendanceFileName?: string;
  attendanceUploadDate?: string;
  todaFile?: string;
  todaFileName?: string;
  todaUploadDate?: string;
  mode?: string;
  platform?: string;
};

export type DayActivities = Record<string, Activity[]>;

type ActivitiesContextType = {
  activities: DayActivities;
  loading: boolean;
  addActivity: (activity: Omit<Activity, 'id' | 'createdBy'>) => Promise<void>;
  updateActivity: (id: number, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: number) => Promise<void>;
  refreshActivities: () => Promise<void>;
};

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<DayActivities>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshActivities = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await activitiesAPI.getAll();
      const activitiesList: Activity[] = response.data;

      // Group by date
      const grouped: DayActivities = {};
      activitiesList.forEach(activity => {
        if (!grouped[activity.date]) {
          grouped[activity.date] = [];
        }
        grouped[activity.date].push(activity);
      });

      setActivities(grouped);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshActivities();
  }, [user]);

  const addActivity = async (activityData: Omit<Activity, 'id' | 'createdBy'>) => {
    try {
      await activitiesAPI.create(activityData);
      await refreshActivities();
    } catch (error) {
      console.error('Failed to add activity:', error);
      throw error;
    }
  };

  const updateActivity = async (id: number, updates: Partial<Activity>) => {
    try {
      await activitiesAPI.update(id, updates);
      await refreshActivities();
    } catch (error) {
      console.error('Failed to update activity:', error);
      throw error;
    }
  };

  const deleteActivity = async (id: number) => {
    try {
      await activitiesAPI.delete(id);
      await refreshActivities();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    activities,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
    refreshActivities
  }), [activities, loading]);

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error("useActivities must be used within ActivitiesProvider");
  return ctx;
}


