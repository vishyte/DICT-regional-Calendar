export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  project: string;
  created_at: Date;
  updated_at: Date;
}

export interface Activity {
  id: number;
  name: string;
  date: string;
  original_date?: string;
  time: string;
  end_time: string;
  location: string;
  venue: string;
  venue_address?: string;
  sector: string;
  project: string;
  description?: string;
  participants?: number;
  facilitator?: string;
  status: 'Scheduled' | 'Completed' | 'Postponed' | 'Cancelled' | 'Rejected';
  change_reason?: string;
  change_date?: string;
  created_by_id: number;
  creator_role?: string;
  priority?: 'Normal' | 'Urgent';
  partner_institution?: string;
  mode?: string;
  platform?: string;
  created_at: Date;
  updated_at: Date;
  // Approval fields
  approved_by_id?: number;
  approved_at?: string;
  approval_notes?: string;
  // File submission columns
  attendance_file_name?: string;
  attendance_upload_date?: string;
  attendance_file_data?: Buffer;
  toda_file_name?: string;
  toda_upload_date?: string;
  toda_file_data?: Buffer;
}

export interface AssignedPersonnel {
  id: number;
  activity_id: number;
  user_id: number;
  task: string;
}

export interface Document {
  id: number;
  activity_id: number;
  name: string;
  url: string;
  upload_date: Date;
}