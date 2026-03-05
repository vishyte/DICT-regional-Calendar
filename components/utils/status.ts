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
  if (!a) return "Scheduled";

  // For special administrative statuses, keep them as-is
  // Preserve explicit administrative statuses (including Completed)
  const specialStatuses: DisplayStatus[] = ["For Approval", "Postponed", "Cancelled", "Completed"];
  if (specialStatuses.includes(a.status as DisplayStatus)) {
    return a.status as DisplayStatus;
  }

  // Use local date and time to determine status for temporal activities
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const start = a.date;
  const end = a.endDate && a.endDate !== a.date ? a.endDate : null;
  const startTime = a.time || "00:00";
  const endTime = a.end_time || a.endTime || "23:59";

  // Multi-day event
  if (end) {
    if (start > todayKey) {
      // Event starts in the future
      return "Upcoming";
    }
    
    if (end < todayKey) {
      // Event has ended (past end date)
      return "Submission of Documents";
    }
    
    // Today is within the event range
    // If duration is 2 days or more and today is within range => Ongoing
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays >= 2) return "Ongoing";
    
    // For single-day events that span multiple days (shouldn't happen but handle it)
    return "Ongoing";
  }

  // Single-day event - check both date AND time
  if (start < todayKey) {
    // Past date
    return "Submission of Documents";
  }
  
  if (start === todayKey) {
    // Today - check time
    if (endTime <= currentTime) {
      // Past end time today - ACTIVITY ENDED, NEEDS DOCUMENT SUBMISSION
      return "Submission of Documents";
    }
    if (startTime <= currentTime && endTime > currentTime) {
      // Currently ongoing
      return "Ongoing";
    }
    // Before start time today
    return "Upcoming";
  }
  
  // Future date
  return "Upcoming";
}

export default deriveDisplayStatus;
