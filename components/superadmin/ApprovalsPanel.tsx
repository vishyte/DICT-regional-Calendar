import { useMemo, useState } from "react";
import { useActivities, Activity } from "../ActivitiesContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Search, FileText, CheckCircle2, XCircle, Calendar, Users } from "lucide-react";

export function ApprovalsPanel() {
  const { activities, loading, updateActivity } = useActivities();
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const allActivities: Activity[] = useMemo(
    () => Object.values(activities).flat(),
    [activities]
  );

  const pendingApprovals = useMemo(
    () =>
      allActivities.filter((a) =>
        a.status === "For Approval"
      ),
    [allActivities]
  );

  const filtered = pendingApprovals.filter((activity) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      activity.name.toLowerCase().includes(query) ||
      activity.project.toLowerCase().includes(query) ||
      activity.location.toLowerCase().includes(query) ||
      activity.createdBy?.fullName.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: Activity["status"]) => {
    if (status === "For Approval") return "bg-purple-100 text-purple-700";
    if (status === "Submission of Documents") return "bg-yellow-100 text-yellow-700";
    if (status === "Completed") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

  const handleDecision = async (
    activity: Activity,
    decision: "approve" | "return"
  ) => {
    const hasFiles = !!activity.attendanceFileName && !!activity.todaFileName;
    if (!hasFiles) {
      toast.error("Cannot proceed", {
        description: "Both Attendance and TODA files are required before approval.",
      });
      return;
    }

    const confirmMessage =
      decision === "approve"
        ? "Approve this activity's TODA and Attendance submission?"
        : "Return this submission for corrections (set back to Submission of Documents)?";

    if (!window.confirm(confirmMessage)) return;

    setProcessingId(activity.id);
    try {
      const newStatus =
        decision === "approve" ? "Completed" : "Submission of Documents";

      await updateActivity(activity.id, { status: newStatus });

      toast.success(
        decision === "approve" ? "Activity approved" : "Submission returned",
        {
          description:
            decision === "approve"
              ? "The activity has been marked as Completed."
              : "The project team can now update and re-submit the documents.",
        }
      );
    } catch (error) {
      console.error("Failed to update activity status:", error);
      toast.error("Failed to update approval status. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Approvals - TODA & Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by activity, project, location, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <div>
                Pending for approval:{" "}
                <span className="font-semibold text-purple-700">
                  {pendingApprovals.length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activities For Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <span>Loading activities...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-600">
                      No activities currently need approval.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.project}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div>
                              {new Date(activity.date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                              {activity.endDate &&
                                activity.endDate !== activity.date && (
                                  <>
                                    {" - "}
                                    {new Date(
                                      activity.endDate
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {activity.time} - {activity.endTime}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {activity.location}
                          </div>
                          <div className="text-xs text-gray-500">
                            {activity.venue}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.createdBy ? (
                          <div className="text-xs text-gray-700">
                            <div className="text-gray-900">
                              {activity.createdBy.fullName}
                            </div>
                            <div className="text-gray-500">
                              {activity.createdBy.project}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-blue-600" />
                            {activity.attendanceFileName ? (
                              <div className="flex gap-2">
                                <a
                                  href={`/api/activities/${activity.id}/file/attendance`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View Attendance
                                </a>
                                <a
                                  href={`/api/activities/${activity.id}/file/attendance`}
                                  download={activity.attendanceFileName}
                                  className="text-gray-500 hover:text-gray-700 text-xs"
                                  title="Download"
                                >
                                  ↓
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                No attendance
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-blue-600" />
                            {activity.todaFileName ? (
                              <div className="flex gap-2">
                                <a
                                  href={`/api/activities/${activity.id}/file/toda`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View TODA
                                </a>
                                <a
                                  href={`/api/activities/${activity.id}/file/toda`}
                                  download={activity.todaFileName}
                                  className="text-gray-500 hover:text-gray-700 text-xs"
                                  title="Download"
                                >
                                  ↓
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400">No TODA</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-700 border-green-200"
                            onClick={() => handleDecision(activity, "approve")}
                            disabled={processingId === activity.id}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-amber-700 border-amber-200"
                            onClick={() => handleDecision(activity, "return")}
                            disabled={processingId === activity.id}
                          >
                            <XCircle className="h-4 w-4" />
                            Return
                          </Button>
                        </div>
                      </TableCell>
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

