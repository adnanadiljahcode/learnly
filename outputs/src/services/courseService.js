import { supabase } from "../lib/supabase";

export async function addBookmark(userId, courseId) {
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ user_id: userId, course_id: courseId })
    .select("id,course_id")
    .single();
  if (error) throw error;
  return data;
}

export async function removeBookmark(userId, bookmarkId) {
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function createEnrollment(userId, courseId) {
  const { data, error } = await supabase
    .from("enrollments")
    .insert({ user_id: userId, course_id: courseId })
    .select("id,course_id,enrolled_at,completed_at")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCourseLessons(courseId) {
  const { data, error } = await supabase
    .from("lessons")
    .select("id,course_id,title,position,duration_minutes,content")
    .eq("course_id", courseId)
    .order("position");
  if (error) throw error;
  return data || [];
}
