import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useActivities, type Activity as CtxActivity, type DayActivities } from "./ActivitiesContext";
import { activitiesAPI } from "../utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { ChevronLeft, ChevronRight, Calendar, CalendarPlus, MapPin, FileText, Clock, Users, Edit, Eye, UserCheck, AlertCircle, CheckCircle } from "lucide-react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { formatTimeDisplay } from "./utils/timeFormat";
import { deriveDisplayStatus } from "./utils/status";
import { isPhilippineHoliday, getHolidayColor, getHolidayBadgeColor, philippineHolidays } from "./utils/philippineHolidays";

interface CalendarViewProps {
  onNavigateToActivity: (dateKey?: string) => void;
  onNavigateToProvinces: () => void;
  onNavigateToRecords: () => void;
}

// extend context activity with optional province; some components (ActivitiesPerProvince) derive this from location
// since the API does not include a province field, we compute it when needed
type Activity = CtxActivity & {
  province?: string;
};

export function CalendarView({ onNavigateToActivity, onNavigateToProvinces, onNavigateToRecords }: CalendarViewProps) {
  const { user } = useAuth();
  const { activities, updateActivity } = useActivities();
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // Current month
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedAssignedPersonnel, setSelectedAssignedPersonnel] = useState<Array<{ idNumber: string; fullName: string; task?: string }>>([]);
  const [loadingAssignedPersonnel, setLoadingAssignedPersonnel] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newDate, setNewDate] = useState("");
  const [changeStatus, setChangeStatus] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editPartnerInstitution, setEditPartnerInstitution] = useState("");
  const [editFinalPax, setEditFinalPax] = useState<string>("");
  const [editAssignedPersonnel, setEditAssignedPersonnel] = useState<Array<{ idNumber: string; fullName: string; task: string }>>([]);
  // activities come from context now

  // Live clock
  const [now, setNow] = useState<Date>(new Date());
  const [, setRefreshCounter] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time status update - refresh every minute
  useEffect(() => {
    const statusTimer = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 60000); // Update every 60 seconds
    return () => clearInterval(statusTimer);
  }, []);


  // list used when attempting to infer a province from a free‑form location string
  const FIXED_PROVINCES = [
    "Davao City",
    "Davao de Oro",
    "Davao Oriental",
    "Davao Occidental",
    "Davao del Sur",
    "Davao del Norte",
  ];

  const inferProvince = (loc: string) => {
    if (!loc) return "Unknown";
    const lower = loc.toLowerCase();
    const matched = FIXED_PROVINCES.find(p => lower.includes(p.toLowerCase()));
    return matched || loc;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isPastDate = (date: Date) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return date < todayStart;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleEditActivity = (activity: Activity) => {
    // only creator may edit
    if (user?.idNumber !== activity.createdBy?.idNumber) {
      toast.error("You can only edit activities you created");
      return;
    }
    setEditingActivity(activity);
    setNewDate(activity.date);
    setChangeStatus("");
    setChangeReason("");
    setEditTitle(activity.name || "");
    setEditVenue(activity.venue || "");
    setEditPartnerInstitution(activity.partnerInstitution || "");
    setEditFinalPax(activity.participants?.toString() || "");
    setEditAssignedPersonnel(activity.assignedPersonnel || []);
    setViewDialogOpen(false);
    setEditDialogOpen(true);
  };



  const handleUpdatePersonnelTask = (idNumber: string, task: string) => {
    setEditAssignedPersonnel(prev => prev.map(p => 
      p.idNumber === idNumber ? { ...p, task } : p
    ));
  };

  const handleSaveChanges = async () => {
    if (!editingActivity) return;
    
    if ((changeStatus === "Postponed" || changeStatus === "Cancelled") && !changeReason.trim()) {
      alert("Please provide a reason for postponing or cancelling this activity.");
      return;
    }

    const oldDateKey = editingActivity.date;
    const newDateKey = newDate;
    const dateChanged = newDate !== editingActivity.date;

    // Build a sanitized updates object (omit id, convert createdBy to id)
    const updatedActivity: Partial<Activity> = {
      name: editTitle,
      venue: editVenue,
      partnerInstitution: editPartnerInstitution,
      participants: editFinalPax ? parseInt(editFinalPax, 10) : undefined,
      assignedPersonnel: editAssignedPersonnel.length > 0 ? editAssignedPersonnel : undefined,
    };

    // If date changed
    if (dateChanged) {
      updatedActivity.originalDate = editingActivity.originalDate || editingActivity.date;
      updatedActivity.date = newDate;
    }

    // If status or date changed in a way that requires admin approval (reschedule/postpone/cancel)
    const isRescheduleRequest = dateChanged && !changeStatus;
    const isStatusChangeRequest = changeStatus === "Postponed" || changeStatus === "Cancelled";

    if (isRescheduleRequest || isStatusChangeRequest) {
      // Request approval from admin for these kinds of changes
      updatedActivity.status = "For Approval" as any;
      updatedActivity.requestedStatus = isStatusChangeRequest ? changeStatus : "Rescheduled";
      updatedActivity.changeReason = changeReason || undefined;
      updatedActivity.changeDate = new Date().toISOString();
    } else if (changeStatus) {
      // Marking as Completed should transition to "Submission of Documents" (yellow)
      if (changeStatus === "Completed") {
        updatedActivity.status = "Submission of Documents" as any;
      } else {
        updatedActivity.status = changeStatus as "Scheduled" | "Completed" | "Submission of Documents" | "Postponed" | "Cancelled";
      }
      updatedActivity.changeReason = changeReason;
      updatedActivity.changeDate = new Date().toISOString();
    }

    // If the existing activity has a createdBy with an idNumber, send just the id
    if (editingActivity.createdBy) {
      // assume idNumber is numeric string representing user id
      const num = parseInt(editingActivity.createdBy.idNumber, 10);
      if (!isNaN(num)) {
        updatedActivity.createdBy = num as any;
      }
    }

    try {
      await updateActivity(editingActivity.id, updatedActivity);
      toast.success("Activity updated successfully");
      setEditDialogOpen(false);
      setEditingActivity(null);
      setChangeReason("");
      setChangeStatus("");
    } catch (error) {
      toast.error("Failed to update activity");
    }
  };

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="p-2" />);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    const dayActivities = activities[dateKey] || [];
     const holiday = isPhilippineHoliday(dateKey);
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const isSelected =
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();

    days.push(
      <div
        key={day}
        onClick={() => {
          // Allow selecting past dates to view past activities
          setSelectedDate(date);
           if (holiday) setSelectedHoliday(holiday);
           else setSelectedHoliday(null);
        }}
         className={`p-3 min-h-[140px] border cursor-pointer transition-all hover:bg-blue-50 ${
           holiday ? getHolidayColor(holiday.type) : (isToday ? "bg-blue-100 border-blue-400" : "bg-white")
         } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      >
         <div className={`text-sm mb-1 font-semibold ${isToday ? "text-blue-700" : "text-gray-700"}`}>
          {day}
           {holiday && <Gift className="h-3 w-3 inline ml-1 text-red-600" />}
        </div>
        <div className="space-y-1">
           {holiday && (
             <div className={`text-[10px] font-medium px-1 py-0.5 rounded line-clamp-2 ${getHolidayBadgeColor(holiday.type)}`}>
               {holiday.name}
             </div>
           )}
          {dayActivities.length > 0 && (
            <div className="text-[11px] font-medium text-blue-700">
              {dayActivities.length} {dayActivities.length === 1 ? "activity" : "activities"}
            </div>
          )}
        </div>
      </div>
    );
  }

  const selectedActivities = selectedDate ? activities[formatDateKey(selectedDate)] || [] : [];

  // Calculate statistics
  // flatten the context activities and treat them as our extended Activity type
  const allActivities = Object.values(activities).flat() as Activity[];
  const totalActivities = allActivities.length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const activitiesThisMonth = allActivities.filter(activity => {
    const activityDate = new Date(activity.date);
    return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear;
  });
  
  const participantsThisMonth = activitiesThisMonth.reduce((sum, activity) => sum + (activity.participants || 0), 0);
  
  const activitiesThisYear = allActivities.filter(activity => {
    const activityDate = new Date(activity.date);
    return activityDate.getFullYear() === currentYear;
  });
  
  const participantsThisYear = activitiesThisYear.reduce((sum, activity) => sum + (activity.participants || 0), 0);

  // compute activities per province (infer if not provided)
  const activitiesByProvince: Record<string, number> = {};
  // start with zero counts for every known province to ensure cards appear even if empty
  FIXED_PROVINCES.forEach(p => {
    activitiesByProvince[p] = 0;
  });
  allActivities.forEach(act => {
    const prov = act.province || inferProvince(act.location);
    activitiesByProvince[prov] = (activitiesByProvince[prov] || 0) + 1;
  });

  // build quick stats: total first, then one card per province
  const quickStats = [
    { label: "Total Activities", value: totalActivities.toString(), icon: Clock, color: "bg-blue-500" },
    ...Object.entries(activitiesByProvince).map(([prov, count]) => ({
      label: prov,
      value: count.toString(),
      icon: MapPin,
      color: "bg-green-500",
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Today Bar: Time, Date, and Today's Activities */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-gray-900 text-lg font-medium">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                <div className="text-gray-600 text-sm">{now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
              </div>
            </div>
            {/* Today's Activities inline list: smart date display */}
            {(() => {
              const todayKey = new Date().toISOString().slice(0, 10);
              const todays = activities[todayKey] || [];
              if (todays.length === 0) return null;
              
              const getDateDisplay = (activity: any) => {
                const startDate = new Date(activity.date);
                const startDateKey = activity.date;
                const todayKey = new Date().toISOString().slice(0, 10);
                
                // Check if this is today
                if (startDateKey === todayKey) {
                  // For multi-day events starting today, show the full range
                  if (activity.endDate && activity.endDate !== activity.date) {
                    const endDate = new Date(activity.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return `Today - ${endDate}`;
                  }
                  return "Today";
                }
                
                // For multi-day events, show the full range
                if (activity.endDate && activity.endDate !== activity.date) {
                  const endDate = new Date(activity.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const formattedDate = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return `${formattedDate} - ${endDate}`;
                }
                
                // For single-day events, show just the start date
                const formattedDate = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return formattedDate;
              };
              
              return (
                <div className="flex-1 overflow-x-auto">
                  <div className="flex flex-col items-center">
                    <div className="text-sm text-gray-800 mb-1 font-medium">Today's Activities:</div>
                    <div className="text-base text-blue-800 whitespace-nowrap">
                      {todays.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className={`mr-3 inline-flex flex-col items-start rounded-md hover:bg-blue-50 px-2 py-1 transition-colors text-left align-top ${
                            a.priority === "Urgent" ? "hover:bg-red-50 hover:text-red-900 text-red-700" : "hover:text-blue-900 text-blue-900"
                          }`}
                          onClick={() => {
                            setSelectedActivity(a);
                            setViewDialogOpen(true);
                          }}
                          title={`${a.name}`}
                        >
                          <span className="truncate max-w-[260px] font-semibold">{a.name}</span>
                          <span className="opacity-80 text-xs">
                            {getDateDisplay(a)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
      {/* helper: status color classes */}
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => onNavigateToActivity(selectedDate ? formatDateKey(selectedDate) : undefined)}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Create New Activity
        </Button>
        <Button
          onClick={onNavigateToProvinces}
          variant="outline"
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          Activities Per Province
        </Button>
        <Button
          onClick={onNavigateToRecords}
          variant="outline"
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Activity Records
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <CardDescription>Activity Calendar</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={previousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-gray-700 bg-gray-50"
                >
                  {day}
                </div>
              ))}
              {days}
            </div>
          </CardContent>
        </Card>

        {/* Right Sidebar: Activity Details */}
        <div className="space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-900">
              {selectedDate
                ? `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
                : "Select a Date"}
            </CardTitle>
            <CardDescription>
              {selectedActivities.length > 0
                ? `${selectedActivities.length} ${selectedActivities.length === 1 ? "activity" : "activities"} scheduled`
                : "No activities scheduled"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedActivities.length > 0 ? (
              <div className="space-y-4">
                {selectedActivities.map((activity) => {
                  const displayStatus = deriveDisplayStatus(activity) || activity.status;
                  return (
                  <div
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setSelectedAssignedPersonnel([]);
                      setLoadingAssignedPersonnel(true);
                      setViewDialogOpen(true);

                      activitiesAPI.getAssignedPersonnel(activity.id)
                        .then((resp) => {
                          setSelectedAssignedPersonnel(resp.data || []);
                        })
                        .catch((err) => {
                          console.warn('Failed to load assigned personnel:', err);
                          setSelectedAssignedPersonnel([]);
                        })
                        .finally(() => setLoadingAssignedPersonnel(false));
                    }}
                    className={`p-4 rounded-lg space-y-2 cursor-pointer transition-all border 
                      ${activity.priority === "Urgent" ? "bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400" : ""}
                      ${activity.priority !== "Urgent" && displayStatus === "Completed" ? "bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300" : ""}
                      ${activity.priority !== "Urgent" && displayStatus === "Submission of Documents" ? "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300" : ""}
                      ${activity.priority !== "Urgent" && displayStatus === "Scheduled" ? "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300" : ""}
                      ${activity.priority !== "Urgent" && displayStatus === "Postponed" ? "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300" : ""}
                      ${activity.priority !== "Urgent" && displayStatus === "Cancelled" ? "bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`text-gray-900 ${activity.priority === "Urgent" ? "font-bold text-red-700" : ""}`}>
                        {activity.name}
                        {activity.priority === "Urgent" && (
                          <span className="ml-2 inline-block px-2 py-0.5 bg-red-200 text-red-800 text-xs font-semibold rounded">
                            URGENT
                          </span>
                        )}
                      </div>
                      <Eye className={`h-4 w-4 ${activity.priority === "Urgent" ? "text-red-600" : "text-blue-600"}`} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {(() => {
                        const startDate = new Date(activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        if (activity.endDate && activity.endDate !== activity.date) {
                          const endDate = new Date(activity.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                          return `${startDate} - ${endDate}`;
                        }
                        return startDate;
                      })()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatTimeDisplay(activity.time)} - {formatTimeDisplay(activity.endTime)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {activity.location}
                    </div>
                    {activity.assignedPersonnel && activity.assignedPersonnel.length > 0 && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 mt-1" />
                        <div className="space-y-0.5">
                          <div className="font-medium">Assigned Personnel</div>
                          <div className="text-xs">
                            {activity.assignedPersonnel
                              .map((p) => `${p.fullName}${p.task ? ` (${p.task})` : ''}`)
                              .join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                    {activity.createdBy && (
                      <div className="text-xs text-gray-600">
                        Created by {activity.createdBy.fullName.charAt(0).toUpperCase() + activity.createdBy.fullName.slice(1).toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Badge variant="secondary">{activity.sector}</Badge>
                      {activity.priority === "Urgent" && (
                        <Badge className="bg-red-600 text-white">Urgent</Badge>
                      )}
                      <Badge className="bg-blue-600 w-[90px] overflow-hidden whitespace-nowrap" title={activity.project}>
                        <span className={`inline-block ${activity.project.length > 12 ? 'animate-marquee' : ''}`}>
                          {activity.project}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {selectedDate ? (
                  <>
                    <CalendarPlus className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No activities scheduled for this date</p>
                    <Button
                      variant="link"
                      onClick={() => onNavigateToActivity(selectedDate ? formatDateKey(selectedDate) : undefined)}
                      className="mt-2 text-blue-600"
                    >
                      Create an activity
                    </Button>
                  </>
                ) : (
                  <>
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Click on a date to view activities</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Activity Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedActivity && (() => {
            const displaySelectedStatus = deriveDisplayStatus(selectedActivity) || selectedActivity.status;
            const startDateStr = new Date(selectedActivity.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const endDateStr = selectedActivity.endDate && selectedActivity.endDate !== selectedActivity.date
              ? new Date(selectedActivity.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : null;

            return (
            <>
              <DialogHeader>
                <DialogTitle className="text-blue-900">{selectedActivity.name}</DialogTitle>
                <DialogDescription>
                  {endDateStr
                    ? `${startDateStr} - ${endDateStr} • ${formatTimeDisplay(selectedActivity.time)} - ${formatTimeDisplay(selectedActivity.endTime)}`
                    : `${startDateStr} • ${formatTimeDisplay(selectedActivity.time)} - ${formatTimeDisplay(selectedActivity.endTime)}`
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status Badge and Priority */}
                <div className="flex gap-2">
                  <Badge
                    className={
                      displaySelectedStatus === "Completed"
                        ? "bg-green-600"
                        : displaySelectedStatus === "Submission of Documents"
                        ? "bg-yellow-600"
                        : displaySelectedStatus === "Scheduled"
                        ? "bg-blue-600"
                        : displaySelectedStatus === "Postponed"
                        ? "bg-orange-600"
                        : "bg-red-600"
                    }
                  >
                    {displaySelectedStatus}
                  </Badge>
                  {selectedActivity.priority === "Urgent" && (
                    <Badge className="bg-red-600 text-white">
                      ⚠️ URGENT PRIORITY
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-1" />
                    <div>
                      <div className="font-medium">Start Date</div>
                      <div>{startDateStr}</div>
                    </div>
                  </div>
                  {endDateStr && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-1" />
                      <div>
                        <div className="font-medium">End Date</div>
                        <div>{endDateStr}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Change Alert */}
                {(selectedActivity.changeReason || selectedActivity.originalDate) && (
                  <>
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <p className="font-medium mb-1">Activity Status Changed</p>
                        {selectedActivity.originalDate && (
                          <p className="text-sm">
                            Original Date: {new Date(selectedActivity.originalDate).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </p>
                        )}
                        {selectedActivity.changeReason && (
                          <p className="text-sm mt-1">Reason: {selectedActivity.changeReason}</p>
                        )}
                        {selectedActivity.changeDate && (
                          <p className="text-xs mt-1">
                            Changed on: {new Date(selectedActivity.changeDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                <Separator />

                {/* Activity Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Time</div>
                        <div className="text-gray-900">
                          {formatTimeDisplay(selectedActivity.time)} - {formatTimeDisplay(selectedActivity.endTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Location</div>
                        <div className="text-gray-900">{selectedActivity.location}</div>
                        <div className="text-sm text-gray-600">{selectedActivity.venue}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Expected Participants</div>
                        <div className="text-gray-900">{selectedActivity.participants} attendees</div>
                      </div>
                    </div>

                    {(selectedAssignedPersonnel && selectedAssignedPersonnel.length > 0) && (
                      <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-600">Assigned Personnel</div>
                          <div className="text-gray-900 text-sm">
                            {selectedAssignedPersonnel
                              .map((p) => `${p.fullName}${p.task ? ` (${p.task})` : ''}`)
                              .join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                    {loadingAssignedPersonnel ? (
                      <div className="text-sm text-gray-600">Loading assigned personnel...</div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {selectedAssignedPersonnel.length === 0 ? 'No assigned personnel.' : ''}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <UserCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Created By</div>
                        <div className="text-gray-900">{selectedActivity.createdBy ? selectedActivity.createdBy.fullName.replace(/\b\w/g, l => l.toUpperCase()) : "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Full Address</div>
                        <div className="text-gray-900">{selectedActivity.venueAddress || `${selectedActivity.venue || ""}, ${selectedActivity.location || ""}`}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Project</div>
                        <div className="text-gray-900">{selectedActivity.project}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div>
                        <div className="text-sm text-gray-600">Target Sector</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(selectedActivity.targetSector && selectedActivity.targetSector.length > 0)
                            ? selectedActivity.targetSector.map((s: string) => (
                                <Badge key={s} variant="outline" className="text-xs">
                                  {s}
                                </Badge>
                              ))
                            : (
                              <Badge variant="secondary" className="mt-1">
                                {selectedActivity.sector}
                              </Badge>
                            )
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Description</div>
                  <p className="text-gray-900">{selectedActivity.description}</p>
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleEditActivity(selectedActivity)}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                  disabled={!(user?.idNumber && selectedActivity?.createdBy?.idNumber === user.idNumber)}
                >
                  <Edit className="h-4 w-4" />
                  Edit Activity
                </Button>
              </DialogFooter>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update activity details. Date and time cannot be edited directly.
            </DialogDescription>
          </DialogHeader>
          
          {editingActivity && (
            <div className="space-y-6 py-4">
              {/* Date/Time (Read-only) */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-600">Start Date</Label>
                  <p className="text-gray-900 font-medium">
                    {new Date(editingActivity.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Time</Label>
                  <p className="text-gray-900 font-medium">
                    {formatTimeDisplay(editingActivity.time)} - {formatTimeDisplay(editingActivity.endTime)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">End Date</Label>
                  <p className="text-gray-900 font-medium">
                    {editingActivity.endDate
                      ? new Date(editingActivity.endDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric"
                        })
                      : new Date(editingActivity.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric"
                        })
                    }
                  </p>
                </div>
                <p className="text-xs text-gray-500 col-span-3">Date and time cannot be edited directly</p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter activity title"
                  required
                  disabled={!(user?.idNumber && editingActivity?.createdBy?.idNumber === user.idNumber)}
                />
              </div>



              {/* Venue */}
              <div className="space-y-2">
                <Label htmlFor="edit-venue">Venue</Label>
                <Input
                  id="edit-venue"
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  placeholder="Enter venue"
                />
              </div>

              {/* Partner Institution */}
              <div className="space-y-2">
                <Label htmlFor="edit-partner">Partner Institution</Label>
                <Input
                  id="edit-partner"
                  value={editPartnerInstitution}
                  onChange={(e) => setEditPartnerInstitution(e.target.value)}
                  placeholder="Enter partner institution"
                />
              </div>

              {/* Final PAX */}
              <div className="space-y-2">
                <Label htmlFor="edit-pax">Final PAX (Participants)</Label>
                <Input
                  id="edit-pax"
                  type="number"
                  min="0"
                  value={editFinalPax}
                  onChange={(e) => setEditFinalPax(e.target.value)}
                  placeholder="Enter number of participants"
                />
              </div>

              {/* Assigned Personnel Tasks */}
              {editAssignedPersonnel.length > 0 && (
                <div className="space-y-2">
                  <Label>Assigned Personnel Tasks</Label>
                  <div className="space-y-2">
                    {editAssignedPersonnel.map((person) => (
                      <div key={person.idNumber} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-900">{person.fullName}</p>
                          <p className="text-xs text-gray-500">{person.idNumber}</p>
                        </div>
                        <Input
                          placeholder="Enter task/role for this personnel"
                          value={person.task}
                          onChange={(e) => handleUpdatePersonnelTask(person.idNumber, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* Status Change Section */}
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="change-status">Change Status (Optional)</Label>
                <Select value={changeStatus} onValueChange={setChangeStatus}>
                  <SelectTrigger id="change-status">
                    <SelectValue placeholder="Keep current status" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Mark as Scheduled</SelectItem>
                      <SelectItem value="Postponed">Mark as Postponed</SelectItem>
                      <SelectItem value="Cancelled">Mark as Cancelled</SelectItem>
                      <SelectItem value="Submission of Documents">Mark as Submission of Documents</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              {(changeStatus === "Postponed" || changeStatus === "Cancelled") && (
                <div className="space-y-2">
                  <Label htmlFor="change-reason">
                    Reason for {changeStatus === "Postponed" ? "Postponement" : "Cancellation"} *
                  </Label>
                  <Textarea
                    id="change-reason"
                    placeholder="Please provide a reason..."
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    rows={3}
                  />
                  {changeReason.trim().length === 0 && (
                    <p className="text-sm text-red-600">Reason is required</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
