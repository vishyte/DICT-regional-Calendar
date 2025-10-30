import { useState } from "react";
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
import { ChevronLeft, ChevronRight, Calendar, CalendarPlus, MapPin, FileText, Clock, Users, Edit, Eye, UserCheck, AlertCircle, CheckCircle } from "lucide-react";

interface CalendarViewProps {
  onNavigateToActivity: () => void;
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
  // activities come from context now

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
    setViewDialogOpen(false);
    setEditDialogOpen(true);
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

    // Create updated activity
    const updatedActivity: Activity = { ...editingActivity };
    
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
        onClick={() => setSelectedDate(date)}
        className={`p-2 min-h-[100px] border border-gray-200 cursor-pointer transition-all hover:bg-blue-50 ${
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
          onClick={onNavigateToActivity}
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

        {/* Activity Details */}
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
                      {activity.time} - {activity.endTime}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {activity.location}
                    </div>
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
                      onClick={onNavigateToActivity}
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

      {/* Activity Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="text-blue-900">{selectedActivity.name}</DialogTitle>
                <DialogDescription>
                  {selectedActivity.date} • {selectedActivity.time} - {selectedActivity.endTime}
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
                          {selectedActivity.time} - {selectedActivity.endTime}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update activity date or change status
            </DialogDescription>
          </DialogHeader>
          
          {editingActivity && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Activity Name</p>
                <p className="text-gray-900">{editingActivity.name}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-date">Change Date</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                {newDate !== editingActivity.date && (
                  <p className="text-sm text-blue-600">
                    Date will be changed from {new Date(editingActivity.date).toLocaleDateString()} to {new Date(newDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="change-status">Change Status</Label>
                <Select value={changeStatus} onValueChange={setChangeStatus}>
                  <SelectTrigger id="change-status">
                    <SelectValue placeholder="Select status change" />
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

              {changeStatus === "Completed" && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    This will mark the activity as completed.
                  </AlertDescription>
                </Alert>
              )}

              {changeStatus === "Scheduled" && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    This will mark the activity as scheduled.
                  </AlertDescription>
                </Alert>
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
