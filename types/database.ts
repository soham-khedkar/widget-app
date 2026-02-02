// Database types for Supabase tables

export interface User {
  id: string;
  email: string;
  name: string | null;
  partner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  partner_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  partner_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerInvite {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  created_at: string;
  expires_at: string;
}

export interface SneakPeek {
  id: string;
  user_id: string;
  partner_id: string | null;
  image_url: string; // Storage path, not full URL
  caption: string | null;
  viewed: boolean;
  viewed_at: string | null;
  created_at: string;
  expires_at: string | null;
  created_by: string | null;
}

export interface QuickMessageTemplate {
  id: string;
  user_id: string;
  text: string;
  emoji: string | null;
  color: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuickMessage {
  id: string;
  user_id: string;
  partner_id: string;
  text: string;
  template_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

// Punch Card for LDR day tracking
export interface PunchCard {
  id: string;
  user_id: string;
  partner_id: string | null;
  relationship_start_date: string;
  total_days: number;
  last_punch_date: string | null;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

// Streak for custom daily activities
export interface Streak {
  id: string;
  user_id: string;
  partner_id: string | null;
  topic: string;
  description: string | null;
  background_colors: string[] | null;
  background_style: string | null;
  current_count: number;
  longest_count: number;
  last_checked_date: string | null;
  target_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// AI Generated Background
export interface AIBackground {
  id: string;
  user_id: string;
  prompt: string;
  colors: string[];
  style: string | null;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
}

// Streak Check-in History
export interface StreakCheckin {
  id: string;
  streak_id: string;
  user_id: string;
  checked_at: string;
  note: string | null;
  created_at: string;
}

// Supabase response types
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type DbResultErr = { error: { message: string } };
