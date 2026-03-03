import React, { useMemo, useState } from "react";
import { useActivities } from "./ActivitiesContext";
import { useAuth } from "./AuthContext";
import { deriveDisplayStatus } from "./utils/status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AlertCircle, CheckCircle2, Upload, FileUp } from "lucide-react";
import { Toaster, toast } from "sonner";

export function DocumentsPage() {
  const { activities, updateActivity } = useActivities();
  const { user } = useAuth();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [todaFile, setTodaFile] = useState<File | null>(null);
  const [participantCount, setParticipantCount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Get all activities and filter for pending and completed
  const groupedActivities = useMemo(() => {
    if (!user || !activities) return { pending: [], completed: [] };

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
      completed: completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [activities, user]);

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

  const handleSubmitFiles = async () => {
    if (!selectedActivity) return;

    setSubmittingId(selectedActivity.id);
    try {
      // Update activity with submitted documents
      await updateActivity(selectedActivity.id, {
        status: "Completed",
        attendanceFileName: attendanceFile?.name || "",
        attendanceUploadDate: new Date().toISOString(),
        todaFileName: todaFile?.name || "",
        todaUploadDate: new Date().toISOString(),
        participants: participantCount ? parseInt(participantCount) : selectedActivity.participants,
        notes: notes || selectedActivity.notes
      });
      toast.success(`✅ ${selectedActivity.name}`, {
        description: "Documents submitted successfully",
        duration: 3000
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast.error("Failed to submit documents. Please try again.");
    } finally {
      setSubmittingId(null);
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
    </div>
  );
}

export default DocumentsPage;
