export type Role = "intern" | "lead" | "staff";

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type ShiftStatus = "pending" | "accepted" | "declined" | "swap_sent" | "open" | "proposed";

export type SessionType =
  | "Full practice"
  | "Game"
  | "Half-court work"
  | "Individual workouts"
  | "Early lift"
  | "Live scrimmage"
  | "Film session prep"
  | "Extra time";

export type TaskBucket = "assigned" | "daily" | "practice" | "post" | "game" | "personal";

export type TimeEntrySource = "clocked" | "manual";

export type GuideFormat = "written" | "video" | "document";

export interface Profile {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  role: Role;
  roster_confirmed: boolean;
  alerts_seen_at: string | null;
  clock_in_at: string | null;
  clock_label: string | null;
  created_at: string;
}

export interface Shift {
  id: string;
  day_of_week: DayOfWeek;
  date: string;
  start_time: string;
  end_time: string | null;
  session_type: SessionType;
  camera_role: string | null;
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

export type AvailabilityKind = "busy" | "planned";

export interface Availability {
  id: string;
  profile_id: string;
  day_of_week: DayOfWeek;
  /** Set for a one-time block (this exact date only); null means recurring weekly by day_of_week. */
  specific_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  label: string;
  /** "busy" = can't work (class, day off) — feeds shift-conflict checks. "planned" = informational, coming in outside a shift. */
  kind: AvailabilityKind;
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
  /** For format "document": the uploaded file's storage URL, or a pasted external link (Google Docs, etc.). */
  document_url: string | null;
  /** For format "document": the original filename, or a friendly label when it's an external link. */
  document_name: string | null;
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
