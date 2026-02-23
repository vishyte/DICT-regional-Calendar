export type DisplayStatus =
  | "Scheduled"
  | "Completed"
  | "Submission of Documents"
  | "For Approval"
  | "Postponed"
  | "Cancelled"
  | "Upcoming"
  | "Ongoing";

export function deriveDisplayStatus(a: any): DisplayStatus {
  // If status is not Scheduled, return stored status
  if (!a || a.status !== "Scheduled") return (a?.status as DisplayStatus) || "Scheduled";

  const todayKey = new Date().toISOString().slice(0, 10);
  const start = a.date;
  const end = a.endDate && a.endDate !== a.date ? a.endDate : null;

  // Multi-day event
  if (end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (start <= todayKey && todayKey <= end) {
      // If duration is 2 days or more and today is within range => Ongoing
      if (diffDays >= 2) return "Ongoing";
      // For 1-day ranges that accidentally have endDate same day, show Upcoming/Ongoing based on time elsewhere
      return "Upcoming";
    }

    // If already past the end date
    if (end < todayKey) return "Submission of Documents";
    // If starts in future
    return "Upcoming";
  }

  // Single-day event: past => Submission of Documents, future => Upcoming
  return start < todayKey ? "Submission of Documents" : "Upcoming";
}

export default deriveDisplayStatus;
