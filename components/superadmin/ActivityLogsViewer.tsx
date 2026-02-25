import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Search, Download, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

interface ActivityLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
  status: "success" | "error" | "warning";
  ip?: string;
}

const LOG_STORAGE_KEY = "activity_logs";

// Default sample logs (used only when no stored logs exist)
const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: 1,
    timestamp: "2025-02-18 14:32:15",
    user: "john_doe",
    action: "Created Activity",
    target: "test FOR test",
    details: "New activity created for IIDB project",
    status: "success",
    ip: "192.168.1.100",
  },
  {
    id: 2,
    timestamp: "2025-02-18 13:45:22",
    user: "jane_smith",
    action: "Updated Activity",
    target: "Monthly Training Session",
    details: "Changed status to Ongoing",
    status: "success",
    ip: "192.168.1.101",
  },
  {
    id: 3,
    timestamp: "2025-02-18 12:10:05",
    user: "mark_johnson",
    action: "Login",
    target: "System",
    details: "User logged into the system",
    status: "success",
    ip: "192.168.1.102",
  },
  {
    id: 4,
    timestamp: "2025-02-18 11:25:33",
    user: "sarah_williams",
    action: "Submitted Files",
    target: "test FOR test",
    details: "Uploaded Attendance and TODA files",
    status: "success",
    ip: "192.168.1.103",
  },
  {
    id: 5,
    timestamp: "2025-02-18 10:15:48",
    user: "john_doe",
    action: "Login Failed",
    target: "System",
    details: "Invalid credentials provided",
    status: "error",
    ip: "192.168.1.104",
  },
];

function loadLogs(): ActivityLog[] {
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load activity logs from localStorage:", e);
  }
  return DEFAULT_LOGS;
}

function saveLogs(logs: ActivityLog[]) {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save activity logs to localStorage:", e);
    toast.error("Failed to save logs. Please try again.");
  }
}

export function ActivityLogsViewer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Load logs from localStorage on mount
  useEffect(() => {
    const loadedLogs = loadLogs();
    setLogs(loadedLogs);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || log.action.includes(filterType);
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Timestamp", "User", "Action", "Target", "Details", "Status", "IP"],
      ...filteredLogs.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.target,
        log.details,
        log.status,
        log.ip || ""
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Activity logs exported successfully");
  };

  const handleClearLogs = () => {
    setLogs([]);
    saveLogs([]);
    setSearchQuery("");
    setFilterType("all");
    setFilterStatus("all");
    toast.success("All activity logs have been cleared");
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Log Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Action Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Updated">Updated</SelectItem>
                  <SelectItem value="Deleted">Deleted</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear Logs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Activity Logs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all {logs.length} activity log entries.
                    {filteredLogs.length !== logs.length && ` (${filteredLogs.length} currently visible)`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearLogs} className="bg-red-600 hover:bg-red-700">
                    Clear All Logs
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-600">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm font-medium">{log.timestamp}</TableCell>
                      <TableCell className="text-sm">{log.user}</TableCell>
                      <TableCell className="text-sm font-medium">{log.action}</TableCell>
                      <TableCell className="text-sm">{log.target}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs">{log.details}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{log.ip || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
