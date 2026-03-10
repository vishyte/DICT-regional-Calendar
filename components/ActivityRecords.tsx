import api from "../utils/api";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useActivities } from "./ActivitiesContext";
import { activitiesAPI } from "../utils/api";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Search, Filter, Download, Eye, Calendar, Users, Clock, FileText, Upload, AlertCircle, Bell, CheckCircle, XCircle } from "lucide-react";
import { formatTimeDisplay } from "./utils/timeFormat";
import { deriveDisplayStatus } from "./utils/status";
import { Alert, AlertDescription } from "./ui/alert";
import { Toaster, toast } from "sonner";


interface Activity {
  id: string;
  name: string;
  project: string;
  date: string;
  endDate?: string;
  originalDate?: string;
  timeStart: string;
  timeEnd: string;
  duration: string;
  targetSector: string[];
  location?: string;
  province: string;
  district: string;
  barangay: string;
  venueAddress?: string;
  partnerInstitution: string;
  resourcePerson: string;
  mode: string;
  status: "Scheduled" | "Completed" | "Submission of Documents" | "Postponed" | "Cancelled" | "Upcoming" | "Ongoing" | "For Approval";
  priority?: "Normal" | "Urgent";
  participants: number;
  male?: number;
  female?: number;
  notes?: string;
  changeReason?: string;
  changeDate?: string;
  attendanceFile?: string;
  attendanceFileName?: string;
  attendanceUploadDate?: string;
  todaFile?: string;
  todaFileName?: string;
  todaUploadDate?: string;
  platform?: string;
  createdBy?: {
    idNumber: string;
    fullName: string;
    email: string;
  };
}

export function ActivityRecords() {
  const { activities: calendarActivities, uploadDocuments, updateActivity } = useActivities();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [maleCount, setMaleCount] = useState<number | null>(null);
  const [femaleCount, setFemaleCount] = useState<number | null>(null);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [attendanceFileName, setAttendanceFileName] = useState<string>("");
  const [todaFile, setTodaFile] = useState<File | null>(null);
  const [todaFileName, setTodaFileName] = useState<string>("");
  const [, setRefreshCounter] = useState(0);
  
  // Approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvingActivity, setApprovingActivity] = useState<Activity | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvingLoading, setApprovingLoading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportProvince, setExportProvince] = useState<string>("all");

  // Real-time status update - refresh every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
    "Davao Oriental",
    "Davao City"
  ];

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "0",
      name: "Test Activity - Pending Documents",
      project: "Cybersecurity",
      date: "2026-02-28",
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
      status: "Submission of Documents",
      participants: 85,
      notes: "Testing notification bell.",
      createdBy: {
        idNumber: "user123",
        fullName: "John Doe",
        email: "john@example.com"
      }
    },
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

  const mappedFromCalendar = useMemo(() => {
    const out: Activity[] = [];
    for (const [dateKey, items] of Object.entries(calendarActivities)) {
      for (const a of items) {
        out.push({
          id: `cal-${a.id}`,
          name: a.name,
          project: a.project,
          date: a.date,
          endDate: (a as any).endDate,
          timeStart: a.time,
          timeEnd: a.endTime,
          duration: "",
          targetSector: [a.sector].filter(Boolean),
          province: a.location,
          district: "",
          barangay: a.venue,
          venueAddress: a.venueAddress,
          partnerInstitution: "",
          resourcePerson: a.facilitator || "",
          mode: "On-site",
          status: deriveDisplayStatus(a),
          participants: a.participants || 0,
          originalDate: a.originalDate,
          changeReason: a.changeReason,
          changeDate: a.changeDate,
          createdBy: a.createdBy,
        });
      }
    }
    return out;
  }, [calendarActivities, setRefreshCounter]);

  const combinedActivities = useMemo(() => {
    return mappedFromCalendar;
  }, [mappedFromCalendar, setRefreshCounter]);

  useEffect(() => {
    const checkEndedActivities = () => {
      const today = new Date().toISOString().slice(0, 10);
      
      combinedActivities.forEach((activity) => {
        if (user?.idNumber !== activity.createdBy?.idNumber) return;
        
        if (activity.date <= today) {
          if (activity.status === "Submission of Documents" && !sessionStorage.getItem(`notified-${activity.id}`)) {
            toast.info(`📋 ${activity.name}`, {
              description: "Activity ended. Please submit your attendance and TODA files to complete the record.",
              icon: <Bell className="h-4 w-4 text-blue-500" />,
              duration: 10000,
            });
            sessionStorage.setItem(`notified-${activity.id}`, "true");
          }
        }
      });
    };

    checkEndedActivities();
    const notificationTimer = setInterval(checkEndedActivities, 300000);

    return () => clearInterval(notificationTimer);
  }, [combinedActivities, user]);

  const filteredActivities = combinedActivities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.partnerInstitution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === "all" || activity.project === selectedProject;
    const normalize = (s: string) => (s || "").toLowerCase().trim();
    const matchesProvince = selectedProvince === "all" || normalize(activity.province).includes(normalize(selectedProvince));
    const matchesStatus = selectedStatus === "all" || (selectedStatus === "Pending" ? activity.status === "Submission of Documents" : activity.status === selectedStatus);
    const activityMonth = new Date(activity.date).getMonth().toString();
    const matchesMonth = selectedMonth === "all" || activityMonth === selectedMonth;
    
    return matchesSearch && matchesProject && matchesProvince && matchesStatus && matchesMonth;
  });

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const aDate = a.date;
    const bDate = b.date;
    const aCat = aDate === todayKey ? 0 : aDate > todayKey ? 1 : 2;
    const bCat = bDate === todayKey ? 0 : bDate > todayKey ? 1 : 2;
    if (aCat !== bCat) return aCat - bCat;

    if (aCat === 0) {
      return (a.timeStart || "").localeCompare(b.timeStart || "");
    }
    if (aCat === 1) {
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return (a.timeStart || "").localeCompare(b.timeStart || "");
    }
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return (b.timeStart || "").localeCompare(a.timeStart || "");
  });

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "bg-green-100 text-green-700";
    if (status === "Submission of Documents") return "bg-yellow-100 text-yellow-700";
    if (status === "For Approval") return "bg-purple-100 text-purple-700";
    if (status === "Upcoming") return "bg-orange-100 text-orange-700";
    if (status === "Ongoing") return "bg-blue-100 text-blue-700";
    if (status === "Postponed") return "bg-yellow-100 text-yellow-700";
    if (status === "Rejected") return "bg-red-100 text-red-700";
    return "bg-red-100 text-red-700";
  };

  const handleApproval = async () => {
    if (!approvingActivity || !approvingActivity.id.startsWith("cal-")) {
      alert("Invalid activity");
      return;
    }
    
    setApprovingLoading(true);
    try {
      const activityId = parseInt(approvingActivity.id.replace(/^cal-/, ""));
      
      if (approvalAction === "approve") {
        await activitiesAPI.approve(activityId, approvalNotes);
        toast.success("✅ Activity Approved", {
          description: "The activity has been marked as Completed.",
          duration: 3000
        });
      } else {
        await activitiesAPI.reject(activityId, approvalNotes);
        toast.info("📤 Activity Returned", {
          description: "The activity has been returned to staff for re-submission. They will see the rejection reason in their Documents section.",
          duration: 4000
        });
      }
      
      setApprovalDialogOpen(false);
      setApprovingActivity(null);
      setApprovalNotes("");
      
      window.location.reload();
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error(error.response?.data?.error || "Failed to process approval");
    } finally {
      setApprovingLoading(false);
    }
  };

  const openApprovalDialog = (activity: Activity, action: "approve" | "reject") => {
    setApprovingActivity(activity);
    setApprovalAction(action);
    setApprovalNotes("");
    setApprovalDialogOpen(true);
  };

  const handleExport = async (provinceOverride?: string) => {
    const provinceFilter = provinceOverride ?? exportProvince ?? "all";
    const normalize = (s: string) => (s || "").toLowerCase().trim();
    const exportList = filteredActivities.filter(a =>
      provinceFilter === "all" || normalize(a.province).includes(normalize(provinceFilter))
    );
    const exportData = exportList.map((a) => ({
      Title: a.name,
      Project: a.project,
      Date: a.date,
      Location: a.location || a.province,
      Barangay: a.barangay,
      Province: a.province,
      Participants: a.participants,
      Male: (a as any).male ?? '',
      Female: (a as any).female ?? '',
      "Created By": a.createdBy?.fullName || "",
      Status: a.status,
    }));

    const csvHeader = Object.keys(exportData[0] || {});
    const csvRows = [csvHeader.join(','),
      ...exportData.map(row => csvHeader.map(h => {
        const val = row[h as keyof typeof row];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const csvBlob = new Blob([csvRows], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = 'activity-records.csv';
    csvLink.click();
    URL.revokeObjectURL(csvUrl);

    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Activities');
      XLSX.writeFile(wb, 'activity-records.xlsx');
    } catch (err) {
      console.warn('Excel export failed:', err);
    }

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      doc.text('Activity Records', 40, 40);
      const col = csvHeader;
      const rows = exportData.map(r => col.map(c => r[c as keyof typeof r] || ''));
      (doc as any).autoTable({ head: [col], body: rows, startY: 60 });
      doc.save('activity-records.pdf');
    } catch (err) {
      console.warn('PDF export failed:', err);
    }
  };

  const handleEditActivity = (activity: Activity) => {
    if (user?.idNumber !== activity.createdBy?.idNumber) {
      alert("Only the creator may submit documents for this activity.");
      return;
    }
    setEditingActivity(activity);
    setParticipantCount(activity.participants || 0);
    setMaleCount((activity as any).male ?? null);
    setFemaleCount((activity as any).female ?? null);
    setAttendanceFile(null);
    setAttendanceFileName(activity.attendanceFileName || "");
    setTodaFile(null);
    setTodaFileName(activity.todaFileName || "");
    setEditDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!editingActivity) return;

    if (editingActivity.status === "Ongoing" || editingActivity.status === "Upcoming") {
      alert("Cannot submit files while activity is Upcoming or Ongoing.");
      return;
    }

    if (!attendanceFile && !todaFile) {
      alert("Please upload at least one file (Attendance or TODA) before submitting.");
      return;
    }

    let updatedActivities = activities.map(activity => {
      if (activity.id === editingActivity.id) {
        const updates: Partial<Activity> = {
          participants: participantCount
        };
        // we will handle file uploads separately, so don't add attendanceFile/todaFile here
        return { ...activity, ...updates };
      }
      return activity;
    });

    setActivities(updatedActivities);

    const originalId = editingActivity.id.startsWith("cal-")
      ? parseInt(editingActivity.id.replace(/^cal-/, ""))
      : null;

    if (originalId !== null) {
      try {
        if (attendanceFile || todaFile) {
          // send files + participant count + male/female
          await uploadDocuments(
            originalId,
            attendanceFile || undefined,
            todaFile || undefined,
            participantCount,
            maleCount ?? undefined,
            femaleCount ?? undefined
          );
        } else {
          await updateActivity(originalId, { participants: participantCount });
        }
      } catch (err) {
        console.error('Failed to save changes:', err);
      }
    }
    setEditDialogOpen(false);
    setEditingActivity(null);
    setAttendanceFile(null);
    setTodaFile(null);
  };

return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between pb-4 border-b-2 border-blue-200">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-blue-900">Activity Records</h2>
            <p className="text-gray-600">Browse and manage all activities - upcoming, ongoing, completed, postponed, and cancelled</p>
          </div>
        </div>
        <>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 hover:shadow-lg hover:scale-105 transition-all duration-200">
                <Download className="h-4 w-4" />
                Export Records
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Export Records</DialogTitle>
                <DialogDescription>Select a province to export (or choose All)</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <p className="text-sm text-gray-600">Province</p>
                  <Select value={exportProvince} onValueChange={(v) => setExportProvince(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Provinces</SelectItem>
                      {provinces.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => { handleExport(exportProvince); setExportDialogOpen(false); }}>Export</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Users className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Note:</strong> Activity Records is for viewing activity details. Downloadable files are available only for activities with status "Completed".
        </AlertDescription>
      </Alert>

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
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-gray-900">{combinedActivities.filter(a => a.status === "Submission of Documents").length}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
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
                  <SelectItem value="Pending">Pending</SelectItem>
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
                  <TableRow key={activity.id} className={`hover:bg-gray-50 ${activity.priority === "Urgent" ? "bg-red-50" : ""}`}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-gray-900 ${activity.priority === "Urgent" ? "font-bold text-red-700" : ""}`}>
                            {activity.name}
                            {activity.priority === "Urgent" && (
                              <span className="ml-2 inline-block px-2 py-0.5 bg-red-200 text-red-800 text-xs font-semibold rounded">
                                URGENT
                              </span>
                            )}
                          </p>
                        </div>
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
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{activity.createdBy.fullName.replace(/\b\w/g, l => l.toUpperCase())}</span>
                            {activity.status === "Submission of Documents" && activity.date <= new Date().toISOString().slice(0, 10) && (
                              <span title="Submission reminder: Please upload attendance and TODA files" className="cursor-help">
                                <Bell className="h-4 w-4 text-orange-500 animate-pulse" />
                              </span>
                            )}
                          </div>
                        <div className="text-xs text-gray-500" hidden></div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                        {activity.priority === "Urgent" && (
                          <Badge className="bg-red-600 text-white">
                            Urgent
                          </Badge>
                        )}
                      </div>
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
                                    {activity.createdBy ? activity.createdBy.fullName.replace(/\b\w/g, l => l.toUpperCase()) : "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Start Date</p>
                                  <p className="text-gray-900">
                                    {new Date(activity.date).toLocaleDateString("en-US", {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">End Date</p>
                                  <p className="text-gray-900">
                                    {activity.endDate
                                      ? new Date(activity.endDate).toLocaleDateString("en-US", {
                                          month: "long",
                                          day: "numeric",
                                          year: "numeric"
                                        })
                                      : new Date(activity.date).toLocaleDateString("en-US", {
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
                                    <button
                                      onClick={async () => {
                                        try {
                                          const resp = await api.get(`/activities/${activity.id}/file/attendance`, { responseType: 'blob' });
                                          const blob = new Blob([resp.data]);
                                          const url = URL.createObjectURL(blob);
                                          window.open(url, '_blank');
                                          setTimeout(() => URL.revokeObjectURL(url), 60000);
                                        } catch (err) {
                                          console.error('Failed to fetch attendance file', err);
                                        }
                                      }}
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      {activity.attendanceFileName}
                                    </button>
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

                              {activity.todaFileName && (
                                <div>
                                  <p className="text-sm text-gray-600">TODA File</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <button
                                      onClick={async () => {
                                        try {
                                          const resp = await api.get(`/activities/${activity.id}/file/toda`, { responseType: 'blob' });
                                          const blob = new Blob([resp.data]);
                                          const url = URL.createObjectURL(blob);
                                          window.open(url, '_blank');
                                          setTimeout(() => URL.revokeObjectURL(url), 60000);
                                        } catch (err) {
                                          console.error('Failed to fetch TODA file', err);
                                        }
                                      }}
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      {activity.todaFileName}
                                    </button>
                                  </div>
                                  {activity.todaUploadDate && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Uploaded: {new Date(activity.todaUploadDate).toLocaleDateString("en-US", {
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
                        
                        {/* Removed Submit button from Activity Records - submissions handled elsewhere */}
                        
{activity.status === "For Approval" && (user?.role === "admin" || user?.role === "superadmin") && (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => openApprovalDialog(activity, "approve")}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() => openApprovalDialog(activity, "reject")}
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Activity Files</DialogTitle>
            <DialogDescription>
              Upload required attendance and TODA files, and update participant count
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
                  {editingActivity.endDate && editingActivity.endDate !== editingActivity.date
                    ? `${new Date(editingActivity.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} - ${new Date(editingActivity.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                    : new Date(editingActivity.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant-count">Number of Participants *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Input
                      id="participant-count"
                      type="number"
                      min="0"
                      value={participantCount}
                      onChange={(e) => setParticipantCount(parseInt(e.target.value) || 0)}
                      placeholder="Total"
                    />
                  </div>
                  <div>
                    <Input
                      id="male-count"
                      type="number"
                      min="0"
                      value={maleCount ?? ''}
                      onChange={(e) => setMaleCount(e.target.value === '' ? null : parseInt(e.target.value) || 0)}
                      placeholder="Male"
                    />
                  </div>
                  <div>
                    <Input
                      id="female-count"
                      type="number"
                      min="0"
                      value={femaleCount ?? ''}
                      onChange={(e) => setFemaleCount(e.target.value === '' ? null : parseInt(e.target.value) || 0)}
                      placeholder="Female"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Current: {editingActivity.participants || 0} participants
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Current Status</p>
                <Badge className={getStatusColor(editingActivity.status)}>
                  {editingActivity.status}
                </Badge>
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

              <div className="space-y-2">
                <Label htmlFor="toda-file">Upload Accomplishment Report (PDF)</Label>
                <Input
                  id="toda-file"
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
                      setTodaFile(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                {todaFileName && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>Current file: {todaFileName}</span>
                  </div>
                )}
                {todaFile && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <FileText className="h-4 w-4" />
                    <span>New file: {todaFile.name}</span>
                  </div>
                )}
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>Important:</strong> For completed activities, both Attendance and TODA files must be uploaded before making any updates.
                  This information will be reflected in the home page statistics.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve Activity" : "Reject Activity"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve" 
                ? "Are you sure you want to approve this activity? It will be marked as Completed."
                : "Please provide a reason for rejecting this activity."}
            </DialogDescription>
          </DialogHeader>
          
          {approvingActivity && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Activity Name</p>
                <p className="text-gray-900">{approvingActivity.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Project</p>
                <p className="text-gray-900">{approvingActivity.project}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Submitted Documents</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Attendance:</span>
                    {approvingActivity.attendanceFileName ? (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const resp = await api.get(`/activities/${approvingActivity.id}/file/attendance`, { responseType: 'blob' });
                              const blob = new Blob([resp.data]);
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 60000);
                            } catch (err) {
                              console.error('Failed to fetch attendance file', err);
                            }
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const resp = await api.get(`/activities/${approvingActivity.id}/file/attendance`, { responseType: 'blob' });
                              const blob = new Blob([resp.data]);
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = approvingActivity.attendanceFileName || 'attendance';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              setTimeout(() => URL.revokeObjectURL(url), 60000);
                            } catch (err) {
                              console.error('Failed to download attendance file', err);
                            }
                          }}
                          className="text-gray-500 hover:text-gray-700 text-xs"
                          title="Download"
                        >
                          ↓
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not submitted</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium">TODA:</span>
                    {approvingActivity.todaFileName ? (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const resp = await api.get(`/activities/${approvingActivity.id}/file/toda`, { responseType: 'blob' });
                              const blob = new Blob([resp.data]);
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 60000);
                            } catch (err) {
                              console.error('Failed to fetch TODA file', err);
                            }
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const resp = await api.get(`/activities/${approvingActivity.id}/file/toda`, { responseType: 'blob' });
                              const blob = new Blob([resp.data]);
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = approvingActivity.todaFileName || 'toda';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              setTimeout(() => URL.revokeObjectURL(url), 60000);
                            } catch (err) {
                              console.error('Failed to download TODA file', err);
                            }
                          }}
                          className="text-gray-500 hover:text-gray-700 text-xs"
                          title="Download"
                        >
                          ↓
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not submitted</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">
                  {approvalAction === "approve" ? "Notes (optional)" : "Reason for rejection *"}
                </Label>
                <Textarea
                  id="approval-notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={approvalAction === "approve" 
                    ? "Add any notes about this approval..." 
                    : "Explain why this activity is being rejected..."}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproval}
              disabled={approvingLoading || (approvalAction === "reject" && !approvalNotes.trim())}
              className={approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {approvingLoading ? "Processing..." : approvalAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
