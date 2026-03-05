import api from "../utils/api";
import React, { useMemo, useState } from "react";
import { useActivities } from "./ActivitiesContext";
import { useAuth } from "./AuthContext";
import { deriveDisplayStatus } from "./utils/status";
import { activitiesAPI } from "../utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AlertCircle, CheckCircle2, Upload, FileUp, CheckCircle, XCircle } from "lucide-react";
import { Toaster, toast } from "sonner";

export function DocumentsPage() {
  const { activities, updateActivity, uploadDocuments } = useActivities();
  const { user } = useAuth();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvingLoading, setApprovingLoading] = useState(false);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [todaFile, setTodaFile] = useState<File | null>(null);
  const [participantCount, setParticipantCount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Check if user is admin or superadmin only - staff should not see approval section
  // Handle case where user.role might be undefined (for local users)
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Get all activities and filter for pending, approval, and completed
  const groupedActivities = useMemo(() => {
    if (!user || !activities) return { pending: [], forApproval: [], completed: [] };

    const flattened: any[] = Object.values(activities).flat();

    const pending = flattened.filter(activity => {
      const displayStatus = deriveDisplayStatus(activity);
      if (displayStatus !== "Submission of Documents") return false;

      // Check if belongs to user's project
      if (activity.project === user.project) return true;
      if (activity.createdBy?.idNumber === user.idNumber) return true;
      if (activity.assignedPersonnel?.some((ap: any) => ap.idNumber === user.idNumber)) return true;

      return false;
    });

    const forApproval = flattened.filter(activity => {
      const displayStatus = deriveDisplayStatus(activity);
      if (displayStatus !== "For Approval") return false;

      // Admins see all activities awaiting approval
      if (isAdmin) return true;
      
      // Regular users see only their project's activities
      return activity.project === user.project;
    });

    const completed = flattened.filter(activity => {
      const displayStatus = deriveDisplayStatus(activity);
      if (displayStatus !== "Completed") return false;

      // Check if belongs to user's project
      if (activity.project === user.project) return true;
      if (activity.createdBy?.idNumber === user.idNumber) return true;
      if (activity.assignedPersonnel?.some((ap: any) => ap.idNumber === user.idNumber)) return true;

      return false;
    });

    return {
      pending: pending.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      forApproval: forApproval.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      completed: completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [activities, user, isAdmin]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleOpenSubmitDialog = (activity: any) => {
    setSelectedActivity(activity);
    setAttendanceFile(null);
    setTodaFile(null);
    setParticipantCount("");
    setNotes("");
    setDialogOpen(true);
  };

  const handleOpenApprovalDialog = (activity: any, action: "approve" | "reject") => {
    setSelectedActivity(activity);
    setApprovalAction(action);
    setApprovalNotes("");
    setApprovalDialogOpen(true);
  };

const handleSubmitFiles = async () => {
    if (!selectedActivity) return;

    setSubmittingId(selectedActivity.id);
    try {
      let activityId: number;
      const idStr = String(selectedActivity.id);
      if (idStr.startsWith('cal-')) {
        activityId = parseInt(idStr.replace(/^cal-/, ''));
      } else {
        activityId = parseInt(idStr);
      }

      if (isNaN(activityId)) {
        throw new Error("Invalid activity ID");
      }

      // use uploadDocuments helper to send files and participant count
      await uploadDocuments(
        activityId,
        attendanceFile || undefined,
        todaFile || undefined,
        participantCount ? parseInt(participantCount) : undefined
      );

      toast.success(`✅ ${selectedActivity.name}`, {
        description: "Documents submitted successfully. Waiting for approval.",
        duration: 3000
      });
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error submitting documents:', error);
      toast.error(error.message || "Failed to submit documents. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleApproval = async () => {
    if (!selectedActivity) return;
    
    setApprovingLoading(true);
    try {
      if (approvalAction === "approve") {
        await activitiesAPI.approve(selectedActivity.id, approvalNotes);
        toast.success("✅ Activity Approved", {
          description: "The activity has been marked as Completed.",
          duration: 3000
        });
      } else {
        await activitiesAPI.reject(selectedActivity.id, approvalNotes);
        toast.info("📤 Activity Returned", {
          description: "The activity has been returned to staff for re-submission. They will see the rejection reason in their Documents section.",
          duration: 4000
        });
      }
      
      setApprovalDialogOpen(false);
      setSelectedActivity(null);
      setApprovalNotes("");
      
      // Refresh activities
      window.location.reload();
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error(error.response?.data?.error || "Failed to process approval");
    } finally {
      setApprovingLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold mb-2">Documents</h1>
        <p className="text-gray-600">Manage and track activity submissions and completions</p>
      </div>

      {/* Pending Documents Section */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-800">Pending Submissions ({groupedActivities.pending.length})</CardTitle>
          </div>
          <CardDescription>Activities awaiting document submission</CardDescription>
        </CardHeader>
        <CardContent>
          {groupedActivities.pending.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedActivities.pending.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-yellow-100">
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell>{activity.project}</TableCell>
                      <TableCell>{formatDate(activity.date)}</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-600 hover:bg-yellow-700">Submission of Documents</Badge>
                      </TableCell>
                      <TableCell>
                        {activity.approvalNotes && (
                          <div className="text-xs bg-red-50 border border-red-200 rounded p-2 text-red-700 max-w-xs">
                            <p className="font-medium mb-1">🔙 Feedback from Admin:</p>
                            <p>{activity.approvalNotes}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          onClick={() => handleOpenSubmitDialog(activity)}
                          disabled={submittingId === activity.id}
                          size="sm"
                          className="gap-2 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          <Upload className="h-4 w-4" />
                          {submittingId === activity.id ? 'Submitting...' : 'Submit'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-yellow-700">
              <p>No pending submissions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval of Documents Section - Only for Admins (admin or superadmin role) */}
      {isAdmin && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-800">Approval of Documents ({groupedActivities.forApproval.length})</CardTitle>
            </div>
            <CardDescription>Activities awaiting approval after document submission</CardDescription>
          </CardHeader>
          <CardContent>
            {groupedActivities.forApproval.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedActivities.forApproval.map((activity) => (
                      <TableRow key={activity.id} className="hover:bg-purple-100">
                        <TableCell className="font-medium">{activity.name}</TableCell>
                        <TableCell>{activity.project}</TableCell>
                        <TableCell>{formatDate(activity.date)}</TableCell>
                        <TableCell>{activity.createdBy?.fullName || "—"}</TableCell>
                        <TableCell>
                          <Badge className="bg-purple-600 hover:bg-purple-700">For Approval</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleOpenApprovalDialog(activity, "approve")}
                              size="sm"
                              className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleOpenApprovalDialog(activity, "reject")}
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-purple-700">
                <p>No activities awaiting approval</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completed Documents Section */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Completed Activities ({groupedActivities.completed.length})</CardTitle>
          </div>
          <CardDescription>Successfully completed activities</CardDescription>
        </CardHeader>
        <CardContent>
          {groupedActivities.completed.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedActivities.completed.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-green-100">
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell>{activity.project}</TableCell>
                      <TableCell>{formatDate(activity.date)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-green-700">
              <p>No completed activities</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Activity Files Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Activity Files</DialogTitle>
            <DialogDescription>
              Upload required attendance and TODA files, and update participant count
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Activity Name</p>
                <p className="text-gray-900">{selectedActivity.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Date</p>
                <p className="text-gray-900">
                  {new Date(selectedActivity.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant-count">Number of Participants *</Label>
                <Input
                  id="participant-count"
                  type="number"
                  min="0"
                  value={participantCount}
                  onChange={(e) => setParticipantCount(e.target.value)}
                  placeholder="Enter total participants"
                />
                <p className="text-xs text-gray-500">
                  Current: {selectedActivity.participants || 0} participants
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Current Status</p>
                <Badge className="bg-yellow-600 hover:bg-yellow-700">Submission of Documents</Badge>
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
                        toast.error("Please upload a PDF file for Attendance");
                        e.target.value = "";
                        return;
                      }
                      setAttendanceFile(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                {attendanceFile && (
<div className="flex items-center gap-2 text-sm text-blue-600">
                    <FileUp className="h-4 w-4" />
                    <span>New file: {attendanceFile.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="toda-file">Upload TODA (PDF)</Label>
                <Input
                  id="toda-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== "application/pdf") {
                        toast.error("Please upload a PDF file for TODA");
                        e.target.value = "";
                        return;
                      }
                      setTodaFile(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                {todaFile && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <FileUp className="h-4 w-4" />
                    <span>New file: {todaFile.name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>For completed activities, both Attendance and TODA files must be uploaded before making any updates. This information will be reflected in the home page statistics.</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={submittingId === selectedActivity?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFiles}
              disabled={submittingId === selectedActivity?.id || (!attendanceFile && !todaFile)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              {submittingId === selectedActivity?.id ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
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
          
          {selectedActivity && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Activity Name</p>
                <p className="text-gray-900">{selectedActivity.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Project</p>
                <p className="text-gray-900">{selectedActivity.project}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Submitted Documents</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Attendance:</span>
                    {selectedActivity.attendanceFileName ? (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const resp = await api.get(`/activities/${selectedActivity.id}/file/attendance`, { responseType: 'blob' });
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
                              const resp = await api.get(`/activities/${selectedActivity.id}/file/attendance`, { responseType: 'blob' });
                              const blob = new Blob([resp.data]);
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = selectedActivity.attendanceFileName || 'attendance';
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
                    {selectedActivity.todaFileName ? (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const resp = await api.get(`/activities/${selectedActivity.id}/file/toda`, { responseType: 'blob' });
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
                              const resp = await api.get(`/activities/${selectedActivity.id}/file/toda`, { responseType: 'blob' });
                              const blob = new Blob([resp.data]);
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = selectedActivity.todaFileName || 'toda';
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
                <Input
                  id="approval-notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={approvalAction === "approve" 
                    ? "Add any notes about this approval..." 
                    : "Explain why this activity is being rejected..."}
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

export default DocumentsPage;
