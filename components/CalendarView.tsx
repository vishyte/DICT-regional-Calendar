import { useEffect, useState } from "react";
import { useActivities, type Activity as CtxActivity, type DayActivities } from "./ActivitiesContext";
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
import { ChevronLeft, ChevronRight, Calendar, CalendarPlus, MapPin, FileText, Clock, Users, Edit, Eye, UserCheck, AlertCircle, CheckCircle, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { formatTimeDisplay } from "./utils/timeFormat";

interface CalendarViewProps {
  onNavigateToActivity: (dateKey?: string) => void;
  onNavigateToProvinces: () => void;
  onNavigateToRecords: () => void;
}

type Activity = CtxActivity;

export function CalendarView({ onNavigateToActivity, onNavigateToProvinces, onNavigateToRecords }: CalendarViewProps) {
  const { activities, updateActivity } = useActivities();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // October 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newDate, setNewDate] = useState("");
  const [changeStatus, setChangeStatus] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editPartnerInstitution, setEditPartnerInstitution] = useState("");
  const [editFinalPax, setEditFinalPax] = useState<string>("");
  const [editAssignedPersonnel, setEditAssignedPersonnel] = useState<Array<{ idNumber: string; fullName: string; task: string }>>([]);
  const [editDocuments, setEditDocuments] = useState<Array<{ id: string; name: string; url: string; uploadDate: string }>>([]);
  // activities come from context now

  // Live clock
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


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
    setEditingActivity(activity);
    setNewDate(activity.date);
    setChangeStatus("");
    setChangeReason("");
    setEditTitle(activity.name || "");
    setEditDescription(activity.description || "");
    setEditVenue(activity.venue || "");
    setEditPartnerInstitution(activity.partnerInstitution || "");
    setEditFinalPax(activity.participants?.toString() || "");
    setEditAssignedPersonnel(activity.assignedPersonnel || []);
    setEditDocuments(activity.documents || []);
    setViewDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const fileId = String(Date.now() + Math.random());
      const fileUrl = URL.createObjectURL(file);
      setEditDocuments(prev => [...prev, {
        id: fileId,
        name: file.name,
        url: fileUrl,
        uploadDate: new Date().toISOString(),
      }]);
    });
    toast.success("Document(s) uploaded");
  };

  const handleRemoveDocument = (docId: string) => {
    setEditDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleUpdatePersonnelTask = (idNumber: string, task: string) => {
    setEditAssignedPersonnel(prev => prev.map(p => 
      p.idNumber === idNumber ? { ...p, task } : p
    ));
  };

  const handleSaveChanges = () => {
    if (!editingActivity) return;
    
    if ((changeStatus === "Postponed" || changeStatus === "Cancelled") && !changeReason.trim()) {
      alert("Please provide a reason for postponing or cancelling this activity.");
      return;
    }

    const oldDateKey = editingActivity.date;
    const newDateKey = newDate;
    const dateChanged = newDate !== editingActivity.date;

    // Create updated activity with all editable fields
    const updatedActivity: Activity = { 
      ...editingActivity,
      name: editTitle,
      description: editDescription,
      venue: editVenue,
      partnerInstitution: editPartnerInstitution,
      participants: editFinalPax ? parseInt(editFinalPax, 10) : undefined,
      assignedPersonnel: editAssignedPersonnel.length > 0 ? editAssignedPersonnel : undefined,
      documents: editDocuments.length > 0 ? editDocuments : undefined,
    };
    
    // If date changed
    if (dateChanged) {
      updatedActivity.originalDate = editingActivity.originalDate || editingActivity.date;
      updatedActivity.date = newDate;
    }
    
    // If status changed
    if (changeStatus) {
      updatedActivity.status = changeStatus as "Scheduled" | "Completed" | "Postponed" | "Cancelled";
      updatedActivity.changeReason = changeReason;
      updatedActivity.changeDate = new Date().toISOString();
    }

    // Persist changes via context
    updateActivity(editingActivity.id, () => updatedActivity);
    toast.success("Activity updated successfully");
    setEditDialogOpen(false);
    setEditingActivity(null);
    setChangeReason("");
    setChangeStatus("");
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
        }}
        className={`p-3 min-h-[140px] border border-gray-200 cursor-pointer transition-all hover:bg-blue-50 ${
          isToday ? "bg-blue-100 border-blue-400" : "bg-white"
        } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      >
        <div className={`text-sm mb-1 ${isToday ? "text-blue-700" : "text-gray-700"}`}>
          {day}
        </div>
        <div className="space-y-1">
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
  const allActivities = Object.values(activities).flat();
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

  const quickStats = [
    { label: "Total Activities", value: totalActivities.toString(), icon: Clock, color: "bg-blue-500" },
    { label: "This Month", value: activitiesThisMonth.length.toString(), icon: CalendarPlus, color: "bg-green-500" },
    { label: "Participants (Month)", value: participantsThisMonth.toLocaleString(), icon: Users, color: "bg-purple-500" },
    { label: "Participants (Year)", value: participantsThisYear.toLocaleString(), icon: UserCheck, color: "bg-orange-500" },
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
            {/* Today's Activities inline list: time — title */}
            {(() => {
              const todayKey = new Date().toISOString().slice(0, 10);
              const todays = activities[todayKey] || [];
              if (todays.length === 0) return null;
              return (
                <div className="flex-1 overflow-x-auto">
                  <div className="flex flex-col items-center">
                    <div className="text-sm text-gray-800 mb-1 font-medium">Today's Activities:</div>
                    <div className="text-base text-blue-800 whitespace-nowrap">
                      {todays.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="mr-3 inline-flex flex-col items-start rounded-md hover:bg-blue-50 hover:text-blue-900 px-2 py-1 transition-colors text-left align-top"
                          onClick={() => {
                            setSelectedActivity(a);
                            setViewDialogOpen(true);
                          }}
                          title={`${a.name} — ${formatTimeDisplay(a.time)} to ${formatTimeDisplay(a.endTime)}`}
                        >
                          <span className="truncate max-w-[260px] font-semibold text-blue-900">{a.name}</span>
                          <span className="opacity-80">
                            {formatTimeDisplay(a.time)}
                            <span className="opacity-60 mx-1">to</span>
                            {formatTimeDisplay(a.endTime)}
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
          onClick={() => {
            if (selectedDate && isPastDate(selectedDate)) {
              toast.error("Cannot create on a past date", {
                description: "Select today or a future date to create an activity.",
              });
              return;
            }
            onNavigateToActivity(selectedDate ? formatDateKey(selectedDate) : undefined);
          }}
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
                {selectedActivities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setViewDialogOpen(true);
                    }}
                    className={`p-4 rounded-lg space-y-2 cursor-pointer transition-all border 
                      ${activity.status === "Completed" ? "bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300" : ""}
                      ${activity.status === "Scheduled" ? "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300" : ""}
                      ${activity.status === "Postponed" ? "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300" : ""}
                      ${activity.status === "Cancelled" ? "bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-gray-900">{activity.name}</div>
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatTimeDisplay(activity.time)} - {formatTimeDisplay(activity.endTime)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {activity.location}
                    </div>
                    {activity.createdBy && (
                      <div className="text-xs text-gray-600">
                        Created by {activity.createdBy.fullName} ({activity.createdBy.idNumber})
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Badge variant="secondary">{activity.sector}</Badge>
                      <Badge className="bg-blue-600">{activity.project}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {selectedDate ? (
                  <>
                    <CalendarPlus className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No activities scheduled for this date</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        if (selectedDate && isPastDate(selectedDate)) {
                          toast.error("Cannot create on a past date", {
                            description: "Select today or a future date to create an activity.",
                          });
                          return;
                        }
                        onNavigateToActivity(selectedDate ? formatDateKey(selectedDate) : undefined)
                      }}
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
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-blue-900">{selectedActivity.name}</DialogTitle>
                <DialogDescription>
                  {selectedActivity.date} • {formatTimeDisplay(selectedActivity.time)} - {formatTimeDisplay(selectedActivity.endTime)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status Badge */}
                <div>
                  <Badge
                    className={
                      selectedActivity.status === "Completed"
                        ? "bg-green-600"
                        : selectedActivity.status === "Scheduled"
                        ? "bg-blue-600"
                        : selectedActivity.status === "Postponed"
                        ? "bg-orange-600"
                        : "bg-red-600"
                    }
                  >
                    {selectedActivity.status}
                  </Badge>
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <UserCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Created By</div>
                        <div className="text-gray-900">{selectedActivity.createdBy ? `${selectedActivity.createdBy.fullName} (${selectedActivity.createdBy.idNumber})` : "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <UserCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">Facilitator</div>
                        <div className="text-gray-900">{selectedActivity.facilitator}</div>
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
                      <Badge variant="secondary" className="mt-1">
                        {selectedActivity.sector}
                      </Badge>
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
                >
                  <Edit className="h-4 w-4" />
                  Edit Activity
                </Button>
              </DialogFooter>
            </>
          )}
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
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-600">Date</Label>
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
                <p className="text-xs text-gray-500 col-span-2">Date and time cannot be edited directly</p>
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
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter activity description"
                  rows={4}
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

              {/* Documents */}
              <div className="space-y-2">
                <Label>Documents</Label>
                <div className="space-y-2">
                  {editDocuments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {editDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-gray-50">
                          <div className="flex items-center gap-2 flex-1">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <a href={doc.url} download={doc.name} className="text-sm text-blue-600 hover:underline truncate">
                              {doc.name}
                            </a>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      type="file"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <Label htmlFor="document-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 transition-colors">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Upload documents</span>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

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
                    <SelectItem value="Completed">Mark as Completed</SelectItem>
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
