export type Role = "intern" | "lead" | "staff";

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type ShiftStatus = "pending" | "accepted" | "declined" | "swap_sent" | "open";

export type SessionType =
  | "Full practice"
  | "Game"
  | "Half-court work"
  | "Individual workouts"
  | "Early lift"
  | "Live scrimmage"
  | "Film session prep";

export type TaskBucket = "assigned" | "daily" | "practice" | "post" | "game" | "personal";

export type TimeEntrySource = "clocked" | "manual";

export type GuideFormat = "written" | "video";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: Role;
  roster_confirmed: boolean;
  created_at: string;
}

export interface Shift {
  id: string;
  day_of_week: DayOfWeek;
  date: string;
  start_time: string;
  end_time: string | null;
  session_type: SessionType;
  location: string;
  assignee_id: string | null;
  status: ShiftStatus;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface SwapRequest {
  id: string;
  shift_id: string;
  from_profile: string;
  to_profile: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface Availability {
  id: string;
  profile_id: string;
  day_of_week: DayOfWeek;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  label: string;
}

export interface TimeEntry {
  id: string;
  profile_id: string;
  date: string;
  session_label: string;
  hours: number;
  source: TimeEntrySource;
  clock_in_at: string | null;
}

export interface Task {
  id: string;
  bucket: TaskBucket;
  title: string;
  assigned_by: string | null;
  due_label: string | null;
  tag: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface TaskCompletion {
  task_id: string;
  profile_id: string;
  completed_on: string;
  completed_at: string;
}

export interface Guide {
  id: string;
  author_id: string;
  kicker: string;
  title: string;
  format: GuideFormat;
  intro: string;
  video_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuideStep {
  id: string;
  guide_id: string;
  position: number;
  title: string;
  body: string;
  image_url: string | null;
}

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}
