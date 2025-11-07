import { useMemo, useState } from "react";
import { useActivities } from "./ActivitiesContext";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Search, Filter, Download, Eye, Calendar, Users, Clock, FileText, Edit, AlertCircle } from "lucide-react";
import { formatTimeDisplay } from "./utils/timeFormat";
import { Alert, AlertDescription } from "./ui/alert";

interface Activity {
  id: string;
  name: string;
  project: string;
  date: string;
  originalDate?: string;
  timeStart: string;
  timeEnd: string;
  duration: string;
  targetSector: string[];
  province: string;
  district: string;
  barangay: string;
  partnerInstitution: string;
  resourcePerson: string;
  mode: string;
  status: "Completed" | "Postponed" | "Cancelled" | "Upcoming" | "Ongoing";
  participants: number;
  notes?: string;
  changeReason?: string;
  changeDate?: string;
  attendanceFile?: string;
  attendanceFileName?: string;
  attendanceUploadDate?: string;
  createdBy?: {
    idNumber: string;
    fullName: string;
    email: string;
  };
}

export function ActivityRecords() {
  const { activities: calendarActivities } = useActivities();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [attendanceFileName, setAttendanceFileName] = useState<string>("");

  const projects = [
    "IIDB",
    "Free Wi-Fi for All",
    "Cybersecurity",
    "PNPKI",
    "ILCDB",
    "DTC ILCDB Core",
    "ILCDB SPARK",
    "eGOV",
    "Admin and Finance Related Activities",
    "Provincial Activity",
    "RD's Office",
    "Technical Operations Division"
  ];

  const provinces = [
    "Davao De Oro",
    "Davao Del Sur",
    "Davao Del Norte",
    "Davao Occidental",
    "Davao Oriental"
  ];

  // Mock data for past activities
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "1",
      name: "Cybersecurity Awareness Seminar",
      project: "Cybersecurity",
      date: "2025-10-25",
      timeStart: "13:00",
      timeEnd: "16:00",
      duration: "3 hours",
      targetSector: ["Teachers", "Students"],
      province: "Davao Del Norte",
      district: "2nd District",
      barangay: "New Visayas",
      partnerInstitution: "DepEd Division Office",
      resourcePerson: "Technical Operations Division",
      mode: "Hybrid",
      status: "Completed",
      participants: 85,
      notes: "High engagement. Requested follow-up sessions."
    },
    {
      id: "2",
      name: "eGOV Implementation Workshop",
      project: "eGOV",
      date: "2025-10-22",
      timeStart: "08:00",
      timeEnd: "17:00",
      duration: "8 hours",
      targetSector: ["NGA", "LGU"],
      province: "Davao Del Sur",
      district: "1st District",
      barangay: "Rizal",
      partnerInstitution: "Provincial Government",
      resourcePerson: "RD's Office",
      mode: "On-site",
      status: "Completed",
      participants: 42,
      notes: "Successfully demonstrated eGOV platform features."
    },
    {
      id: "3",
      name: "Free Wi-Fi Technical Training",
      project: "Free Wi-Fi for All",
      date: "2025-10-15",
      timeStart: "09:00",
      timeEnd: "15:00",
      duration: "6 hours",
      targetSector: ["LGU"],
      province: "Davao City",
      district: "1st District",
      barangay: "Poblacion",
      partnerInstitution: "City Government of Davao",
      resourcePerson: "Technical Operations Division",
      mode: "On-site",
      status: "Completed",
      participants: 30,
      notes: "Installed 5 new Wi-Fi access points."
    },
    {
      id: "4",
      name: "Digital Literacy for Indigenous People",
      project: "ILCDB SPARK",
      date: "2025-10-10",
      timeStart: "09:00",
      timeEnd: "15:00",
      duration: "6 hours",
      targetSector: ["Indigenous People"],
      province: "Davao de Oro",
      district: "1st District",
      barangay: "Mabini",
      partnerInstitution: "NCIP Regional Office",
      resourcePerson: "Community Relations",
      mode: "On-site",
      status: "Completed",
      participants: 55,
      notes: "Positive feedback from community leaders."
    },
    {
      id: "5",
      name: "Senior Citizen Tech Workshop",
      project: "ILCDB SPARK",
      date: "2025-10-05",
      timeStart: "14:00",
      timeEnd: "16:00",
      duration: "2 hours",
      targetSector: ["Senior Citizen"],
      province: "Davao Oriental",
      district: "2nd District",
      barangay: "San Isidro",
      partnerInstitution: "Municipal Social Welfare",
      resourcePerson: "Training Unit",
      mode: "On-site",
      status: "Completed",
      participants: 38,
      notes: "Basic smartphone and internet usage covered."
    },
    {
      id: "6",
      name: "PNPKI System Deployment",
      project: "PNPKI",
      date: "2025-09-28",
      timeStart: "10:00",
      timeEnd: "16:00",
      duration: "6 hours",
      targetSector: ["NGA"],
      province: "Davao City",
      district: "3rd District",
      barangay: "Buhangin",
      partnerInstitution: "Regional Government Center",
      resourcePerson: "Security Team",
      mode: "On-site",
      status: "Completed",
      participants: 25,
      notes: "Successfully deployed PNPKI certificates."
    },
    {
      id: "7",
      name: "Women in Tech Conference",
      project: "Provincial Activity",
      date: "2025-09-20",
      timeStart: "08:00",
      timeEnd: "17:00",
      duration: "8 hours",
      targetSector: ["Women", "Students"],
      province: "Davao Del Norte",
      district: "1st District",
      barangay: "Sto. Tomas",
      partnerInstitution: "Women's Federation",
      resourcePerson: "Gender and Development Unit",
      mode: "Hybrid",
      status: "Completed",
      participants: 120,
      notes: "Great turnout. Inspired many participants."
    },
    {
      id: "8",
      name: "ILCDB Data Management Orientation",
      project: "ILCDB",
      date: "2025-09-15",
      timeStart: "09:00",
      timeEnd: "12:00",
      duration: "3 hours",
      targetSector: ["LGU"],
      province: "Davao Occidental",
      district: "1st District",
      barangay: "Kiblat",
      partnerInstitution: "Provincial ICT Office",
      resourcePerson: "ILCDB Team",
      mode: "Online",
      status: "Completed",
      participants: 45,
      notes: "Online platform worked smoothly."
    },
    {
      id: "9",
      name: "Student ICT Skills Training",
      project: "ILCDB SPARK",
      date: "2025-09-10",
      timeStart: "13:00",
      timeEnd: "17:00",
      duration: "4 hours",
      targetSector: ["Students"],
      province: "Davao Del Sur",
      district: "2nd District",
      barangay: "Matanao",
      partnerInstitution: "Local High School",
      resourcePerson: "Training Division",
      mode: "On-site",
      status: "Completed",
      participants: 95,
      notes: "Students showed strong interest in programming."
    },
    {
      id: "10",
      name: "Admin Systems Training",
      project: "Admin and Finance Related Activities",
      date: "2025-09-05",
      timeStart: "09:00",
      timeEnd: "16:00",
      duration: "7 hours",
      targetSector: ["NGA"],
      province: "Davao City",
      district: "2nd District",
      barangay: "Matina",
      partnerInstitution: "DICT Regional Office",
      resourcePerson: "Admin and Finance Division",
      mode: "On-site",
      status: "Completed",
      participants: 18,
      notes: "Internal training for new staff."
    },
    {
      id: "11",
      name: "Free Wi-Fi Installation Training",
      project: "Free Wi-Fi for All",
      date: "2025-11-15",
      timeStart: "09:00",
      timeEnd: "17:00",
      duration: "8 hours",
      targetSector: ["LGU", "Teachers"],
      province: "Davao Del Norte",
      district: "1st District",
      barangay: "Poblacion",
      partnerInstitution: "City Government of Davao",
      resourcePerson: "ICT Division",
      mode: "On-site",
      status: "Upcoming",
      participants: 0,
      notes: "Scheduled for next month."
    },
    {
      id: "12",
      name: "ILCDB Data Management Training",
      project: "ILCDB",
      date: "2025-11-20",
      timeStart: "09:00",
      timeEnd: "16:00",
      duration: "7 hours",
      targetSector: ["LGU"],
      province: "Davao De Oro",
      district: "1st District",
      barangay: "Poblacion",
      partnerInstitution: "Provincial ICT Office",
      resourcePerson: "ILCDB Team",
      mode: "Online",
      status: "Upcoming",
      participants: 0,
      notes: "Registration ongoing."
    },
    {
      id: "13",
      name: "PNPKI System Integration Workshop",
      project: "PNPKI",
      date: "2025-10-28",
      timeStart: "10:00",
      timeEnd: "15:00",
      duration: "5 hours",
      targetSector: ["NGA"],
      province: "Davao Del Sur",
      district: "2nd District",
      barangay: "Matina",
      partnerInstitution: "Regional Government Center",
      resourcePerson: "Security Team",
      mode: "Hybrid",
      status: "Ongoing",
      participants: 22,
      notes: "Currently in progress."
    },
    {
      id: "14",
      name: "Digital Literacy Program for Senior Citizens",
      project: "ILCDB SPARK",
      date: "2025-11-05",
      timeStart: "14:00",
      timeEnd: "16:00",
      duration: "2 hours",
      targetSector: ["Senior Citizen"],
      province: "Davao Oriental",
      district: "2nd District",
      barangay: "San Isidro",
      partnerInstitution: "Municipal Social Welfare",
      resourcePerson: "Community Relations",
      mode: "On-site",
      status: "Upcoming",
      participants: 0,
      notes: "Venue confirmed."
    },
    {
      id: "15",
      name: "Tech Training for Indigenous People",
      project: "ILCDB SPARK",
      originalDate: "2025-10-15",
      date: "2025-11-10",
      timeStart: "09:00",
      timeEnd: "15:00",
      duration: "6 hours",
      targetSector: ["Indigenous People"],
      province: "Davao Occidental",
      district: "1st District",
      barangay: "Kiblat",
      partnerInstitution: "NCIP Regional Office",
      resourcePerson: "Outreach Team",
      mode: "On-site",
      status: "Postponed",
      participants: 0,
      changeReason: "Request from partner institution due to conflicting tribal event.",
      changeDate: "2025-10-10T14:30:00"
    },
    {
      id: "16",
      name: "OFW Digital Skills Workshop",
      project: "ILCDB SPARK",
      date: "2025-10-18",
      timeStart: "13:00",
      timeEnd: "17:00",
      duration: "4 hours",
      targetSector: ["OFW"],
      province: "Davao Del Sur",
      district: "1st District",
      barangay: "Digos",
      partnerInstitution: "OWWA Regional Office",
      resourcePerson: "Training Division",
      mode: "Hybrid",
      status: "Cancelled",
      participants: 0,
      changeReason: "Insufficient number of registrants (only 8 out of minimum 20 participants).",
      changeDate: "2025-10-12T09:15:00"
    },
  ]);

  // Map calendar/context activities into records shape (participants default 0, status Upcoming)
  const mappedFromCalendar = useMemo(() => {
    const out: Activity[] = [];
    for (const [dateKey, items] of Object.entries(calendarActivities)) {
      for (const a of items) {
        out.push({
          id: `cal-${a.id}`,
          name: a.name,
          project: a.project,
          date: a.date,
          timeStart: a.time,
          timeEnd: a.endTime,
          duration: "",
          targetSector: [a.sector].filter(Boolean),
          province: a.location,
          district: "",
          barangay: a.venue,
          partnerInstitution: "",
          resourcePerson: a.facilitator || "",
          mode: "On-site",
          status: a.status === "Scheduled" ? "Upcoming" : a.status as any,
          participants: a.participants || 0,
          originalDate: a.originalDate,
          changeReason: a.changeReason,
          changeDate: a.changeDate,
          createdBy: a.createdBy,
        });
      }
    }
    return out;
  }, [calendarActivities]);

  const combinedActivities = useMemo(() => {
    // Show only activities that exist in the calendar context
    return mappedFromCalendar;
  }, [mappedFromCalendar]);

  // Filter activities
  const filteredActivities = combinedActivities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.partnerInstitution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === "all" || activity.project === selectedProject;
    const matchesProvince = selectedProvince === "all" || activity.province === selectedProvince;
    const matchesStatus = selectedStatus === "all" || activity.status === selectedStatus;
    const activityMonth = new Date(activity.date).getMonth().toString();
    const matchesMonth = selectedMonth === "all" || activityMonth === selectedMonth;
    
    return matchesSearch && matchesProject && matchesProvince && matchesStatus && matchesMonth;
  });

  // Sort so today's events first, then upcoming (soonest first), then past (most recent first)
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const aDate = a.date;
    const bDate = b.date;
    const aCat = aDate === todayKey ? 0 : aDate > todayKey ? 1 : 2;
    const bCat = bDate === todayKey ? 0 : bDate > todayKey ? 1 : 2;
    if (aCat !== bCat) return aCat - bCat;

    // Within the same category
    if (aCat === 0) {
      // Today: earliest start time first
      return (a.timeStart || "").localeCompare(b.timeStart || "");
    }
    if (aCat === 1) {
      // Upcoming: earliest date, then earliest time
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return (a.timeStart || "").localeCompare(b.timeStart || "");
    }
    // Past: most recent date first, then latest time
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return (b.timeStart || "").localeCompare(a.timeStart || "");
  });

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "bg-green-100 text-green-700";
    if (status === "Upcoming") return "bg-orange-100 text-orange-700";
    if (status === "Ongoing") return "bg-blue-100 text-blue-700";
    if (status === "Postponed") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700"; // Cancelled
  };

  const handleExport = () => {
    console.log("Exporting data...");
    // Implementation for exporting data
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setParticipantCount(activity.participants || 0);
    setAttendanceFile(null);
    setAttendanceFileName(activity.attendanceFileName || "");
    setEditDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!editingActivity) return;
    
    const updatedActivities = activities.map(activity => {
      if (activity.id === editingActivity.id) {
        const updates: Partial<Activity> = {
          participants: participantCount
        };
        
        // If attendance file was uploaded
        if (attendanceFile) {
          // In a real app, this would upload to a server
          // For now, we'll store the file name and simulate a URL
          updates.attendanceFile = URL.createObjectURL(attendanceFile);
          updates.attendanceFileName = attendanceFile.name;
          updates.attendanceUploadDate = new Date().toISOString();
        }
        
        return { ...activity, ...updates };
      }
      return activity;
    });

    setActivities(updatedActivities);

    // If this record originated from the calendar context (id starts with "cal-"),
    // also update the shared calendar data so the calendar reflects the change.
    if (editingActivity.id.startsWith("cal-")) {
      const originalId = editingActivity.id.replace(/^cal-/, "");
      try {
        const { updateActivity } = useActivities();
        updateActivity(originalId, (a) => ({ ...a, participants: participantCount }));
      } catch {}
    }
    setEditDialogOpen(false);
    setEditingActivity(null);
    setAttendanceFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-blue-200">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-blue-900">Activity Records</h2>
            <p className="text-gray-600">Browse and manage all activities - upcoming, ongoing, completed, postponed, and cancelled</p>
          </div>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Records
        </Button>
      </div>

      {/* Info Banner */}
      <Alert className="bg-blue-50 border-blue-200">
        <Users className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Participant Tracking:</strong> Upload attendance records and update participant counts using the Edit button. 
          These statistics will automatically reflect in the home page dashboard for monthly and yearly totals.
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Records</p>
                <p className="text-gray-900">{combinedActivities.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Upcoming</p>
                <p className="text-gray-900">{combinedActivities.filter(a => a.status === "Upcoming").length}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ongoing</p>
                <p className="text-gray-900">{combinedActivities.filter(a => a.status === "Ongoing").length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-gray-900">{combinedActivities.filter(a => a.status === "Completed").length}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Postponed</p>
                <p className="text-gray-900">{combinedActivities.filter(a => a.status === "Postponed").length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Cancelled</p>
                <p className="text-gray-900">{combinedActivities.filter(a => a.status === "Cancelled").length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-blue-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Province</label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="9">October 2025</SelectItem>
                  <SelectItem value="8">September 2025</SelectItem>
                  <SelectItem value="7">August 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Postponed">Postponed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchQuery || selectedProject !== "all" || selectedProvince !== "all" || selectedStatus !== "all" || selectedMonth !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {filteredActivities.length} of {combinedActivities.length} records
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedProject("all");
                  setSelectedProvince("all");
                  setSelectedStatus("all");
                  setSelectedMonth("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Records Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Activity Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedActivities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="text-gray-900">{activity.name}</p>
                        <p className="text-sm text-gray-500">{formatTimeDisplay(activity.timeStart)} - {formatTimeDisplay(activity.timeEnd)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{activity.project}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-sm">
                            {new Date(activity.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                          {activity.originalDate && (
                            <p className="text-xs text-gray-500">
                              Moved from {new Date(activity.originalDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">{activity.province}</p>
                        <p className="text-xs text-gray-500">{activity.barangay}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{activity.participants}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.createdBy ? (
                        <div className="text-xs text-gray-700">
                          <div className="text-gray-900">{activity.createdBy.fullName}</div>
                          <div className="text-gray-500">{activity.createdBy.idNumber}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{activity.name}</DialogTitle>
                              <DialogDescription>Activity Details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              {(activity.changeReason || activity.originalDate) && (
                                <Alert className="bg-yellow-50 border-yellow-200">
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  <AlertDescription className="text-yellow-800">
                                    <p className="font-medium mb-1">Activity Status Changed</p>
                                    {activity.originalDate && (
                                      <p className="text-sm">
                                        Original Date: {new Date(activity.originalDate).toLocaleDateString("en-US", {
                                          month: "long",
                                          day: "numeric",
                                          year: "numeric"
                                        })}
                                      </p>
                                    )}
                                    {activity.changeReason && (
                                      <p className="text-sm mt-1">Reason: {activity.changeReason}</p>
                                    )}
                                    {activity.changeDate && (
                                      <p className="text-xs mt-1">
                                        Changed on: {new Date(activity.changeDate).toLocaleDateString("en-US", {
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
                              )}
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Project/Program</p>
                                  <p className="text-gray-900">{activity.project}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Created By</p>
                                  <p className="text-gray-900">
                                    {activity.createdBy ? `${activity.createdBy.fullName} (${activity.createdBy.idNumber})` : "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Date</p>
                                  <p className="text-gray-900">
                                    {new Date(activity.date).toLocaleDateString("en-US", {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Time</p>
                                  <p className="text-gray-900">{formatTimeDisplay(activity.timeStart)} - {formatTimeDisplay(activity.timeEnd)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Duration</p>
                                  <p className="text-gray-900">{activity.duration}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Mode</p>
                                  <p className="text-gray-900">{activity.mode}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Participants</p>
                                  <p className="text-gray-900">{activity.participants}</p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="text-gray-900">
                                  {activity.barangay}, {activity.district}, {activity.province}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-600">Target Sector</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {activity.targetSector.map((sector) => (
                                    <Badge key={sector} variant="outline">
                                      {sector}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-600">Partner Institution</p>
                                <p className="text-gray-900">{activity.partnerInstitution}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-600">Resource Person/Unit</p>
                                <p className="text-gray-900">{activity.resourcePerson}</p>
                              </div>
                              
                              {activity.notes && (
                                <div>
                                  <p className="text-sm text-gray-600">Notes</p>
                                  <p className="text-gray-900">{activity.notes}</p>
                                </div>
                              )}
                              
                              {activity.attendanceFileName && (
                                <div>
                                  <p className="text-sm text-gray-600">Attendance File</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <a 
                                      href={activity.attendanceFile} 
                                      download={activity.attendanceFileName}
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      {activity.attendanceFileName}
                                    </a>
                                  </div>
                                  {activity.attendanceUploadDate && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Uploaded: {new Date(activity.attendanceUploadDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <Badge className={getStatusColor(activity.status)}>
                                  {activity.status}
                                </Badge>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleEditActivity(activity)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No activity records found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Activity Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Activity Details</DialogTitle>
            <DialogDescription>
              Upload attendance and record participant count
            </DialogDescription>
          </DialogHeader>
          
          {editingActivity && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Activity Name</p>
                <p className="text-gray-900">{editingActivity.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Date</p>
                <p className="text-gray-900">
                  {new Date(editingActivity.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant-count">Number of Participants *</Label>
                <Input
                  id="participant-count"
                  type="number"
                  min="0"
                  value={participantCount}
                  onChange={(e) => setParticipantCount(parseInt(e.target.value) || 0)}
                  placeholder="Enter total participants"
                />
                <p className="text-xs text-gray-500">
                  Current: {editingActivity.participants || 0} participants
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance-file">Upload Attendance (PDF)</Label>
                <Input
                  id="attendance-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== "application/pdf") {
                        alert("Please upload a PDF file");
                        e.target.value = "";
                        return;
                      }
                      setAttendanceFile(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                {attendanceFileName && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>Current file: {attendanceFileName}</span>
                  </div>
                )}
                {attendanceFile && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <FileText className="h-4 w-4" />
                    <span>New file: {attendanceFile.name}</span>
                  </div>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  This information will be reflected in the home page statistics for monthly and yearly participant counts.
                </AlertDescription>
              </Alert>
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
