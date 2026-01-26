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
  status: 'Scheduled' | 'Completed' | 'Postponed' | 'Cancelled';
  change_reason?: string;
  change_date?: string;
  created_by_id: number;
  priority?: 'Normal' | 'Urgent';
  partner_institution?: string;
  mode?: string;
  platform?: string;
  created_at: Date;
  updated_at: Date;
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