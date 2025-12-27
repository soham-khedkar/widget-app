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

// Supabase response types
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type DbResultErr = { error: { message: string } };
