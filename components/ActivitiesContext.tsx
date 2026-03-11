import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { activitiesAPI } from "../utils/api";
import { useAuth } from "./AuthContext";


export type Activity = {
  id: number;
  name: string;
  date: string; // YYYY-MM-DD (start date)
  endDate?: string; // YYYY-MM-DD (for multi-day events)
  originalDate?: string;
  time: string;
  endTime: string;
  location: string;
  venue: string;
  venueAddress?: string;
  sector: string;
  targetSector?: string[];
  project: string;
  description?: string;
  participants?: number;
  facilitator?: string;
  status: "Scheduled" | "Completed" | "Submission of Documents" | "For Approval" | "Postponed" | "Cancelled";
  changeReason?: string;
  changeDate?: string;
  requestedStatus?: string;
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
  priority?: "Major Event" | "Minor Event" | "Core Task" | "Tech Assistance";
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
  uploadDocuments: (id: number, attendanceFile?: File, todaFile?: File, participantCount?: number, male?: number, female?: number) => Promise<void>;
  refreshActivities: () => Promise<void>;
};

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<DayActivities>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const normalizePriority = (priority?: string): Activity['priority'] | undefined => {
    if (!priority) return undefined;
    const normalized = priority.trim();
    if (normalized === "Normal") return "Core Task";
    if (normalized === "Urgent") return "Major Event";
    // Keep existing valid values
    if (["Major Event", "Minor Event", "Core Task", "Tech Assistance"].includes(normalized)) {
      return normalized as Activity['priority'];
    }
    return undefined;
  };

  // Get local activities from localStorage
  const getLocalActivities = (): Activity[] => {
    try {
      const stored = localStorage.getItem('local_activities');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save activities to localStorage
  const saveLocalActivities = (activitiesToSave: Activity[]): void => {
    localStorage.setItem('local_activities', JSON.stringify(activitiesToSave));
  };

  const refreshActivities = async () => {
    setLoading(true);
    try {
      const response = await activitiesAPI.getAll();
      const activitiesList: Activity[] = response.data;

      // Normalize legacy priorities and group by date
      const grouped: DayActivities = {};
      activitiesList.forEach(activity => {
        const normalized = {
          ...activity,
          priority: normalizePriority(activity.priority as any),
        };
        if (!grouped[normalized.date]) {
          grouped[normalized.date] = [];
        }
        grouped[normalized.date].push(normalized);
      });

      setActivities(grouped);
    } catch (error) {
      console.error('Failed to fetch activities from backend:', error);
      // Fall back to local activities
      const localActivities = getLocalActivities();
      const grouped: DayActivities = {};
      localActivities.forEach(activity => {
        const normalized = {
          ...activity,
          priority: normalizePriority(activity.priority as any),
        };
        if (!grouped[normalized.date]) {
          grouped[normalized.date] = [];
        }
        grouped[normalized.date].push(normalized);
      });
      setActivities(grouped);
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
    } catch (error: any) {
      console.error('Failed to add activity via API:', error);
      // Fall back to local storage
      console.log('Saving activity to local storage...');
      
      const localActivities = getLocalActivities();
      const newId = Math.max(...localActivities.map(a => a.id), 0) + 1;
      
      // Get creator info from current user
      let createdBy = undefined;
      if (user) {
        createdBy = {
          idNumber: user.idNumber,
          fullName: user.fullName,
          email: user.email,
          project: user.project
        };
      }
      
      const newActivity: Activity = {
        id: newId,
        ...activityData,
        createdBy
      };
      
      localActivities.push(newActivity);
      saveLocalActivities(localActivities);
      
      // Refresh to show the new activity
      await refreshActivities();
      console.log('✅ Activity saved locally:', newActivity.name);
    }
  };

  const updateActivity = async (id: number, updates: Partial<Activity>) => {
    try {
      await activitiesAPI.update(id, updates);
      await refreshActivities();
    } catch (error: any) {
      console.error('Failed to update activity via API:', error);
      // Fall back to local storage
      const localActivities = getLocalActivities();
      const index = localActivities.findIndex(a => a.id === id);
      if (index >= 0) {
        localActivities[index] = { ...localActivities[index], ...updates };
        saveLocalActivities(localActivities);
        await refreshActivities();
        console.log('✅ Activity updated locally:', id);
      } else {
        throw error;
      }
    }
  };

  const uploadDocuments = async (
    id: number,
    attendanceFile?: File,
    todaFile?: File,
    participantCount?: number,
    male?: number,
    female?: number
  ) => {
    const form = new FormData();
    if (attendanceFile) form.append('attendance', attendanceFile);
    if (todaFile) form.append('toda', todaFile);
    if (participantCount !== undefined) form.append('participants', String(participantCount));
    if (male !== undefined) form.append('male', String(male));
    if (female !== undefined) form.append('female', String(female));
    try {
      await activitiesAPI.uploadDocuments(id, form);
      await refreshActivities();
    } catch (error) {
      console.error('Failed to upload documents:', error);
      throw error;
    }
  };

  const deleteActivity = async (id: number) => {
    try {
      await activitiesAPI.delete(id);
      await refreshActivities();
    } catch (error: any) {
      console.error('Failed to delete activity via API:', error);
      // Fall back to local storage
      const localActivities = getLocalActivities();
      const filtered = localActivities.filter(a => a.id !== id);
      saveLocalActivities(filtered);
      await refreshActivities();
      console.log('✅ Activity deleted locally:', id);
    }
  };

  const value = useMemo(() => ({
    activities,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
    uploadDocuments,
    refreshActivities
  }), [activities, loading]);

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error("useActivities must be used within ActivitiesProvider");
  return ctx;
}


