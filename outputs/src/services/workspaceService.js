import { supabase } from "../lib/supabase";

export async function fetchWorkspace(userId, activityStartDate) {
  const results = await Promise.all([
    supabase.from("profiles").select("id,full_name").eq("id", userId).maybeSingle(),
    supabase.from("courses").select("id,title,topic,description,lessons_count,estimated_minutes,level").eq("is_published", true).order("created_at", { ascending: true }),
    supabase.from("enrollments").select("id,course_id,enrolled_at,completed_at").eq("user_id", userId),
    supabase.from("bookmarks").select("id,course_id").eq("user_id", userId),
    supabase.from("lessons").select("id,course_id,title,position,duration_minutes").order("position"),
    supabase.from("lesson_progress").select("lesson_id,completed_at").eq("user_id", userId),
    supabase.from("learning_activity").select("activity_date,minutes").eq("user_id", userId).gte("activity_date", activityStartDate).order("activity_date"),
  ]);

  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  const [profile, courses, enrollments, bookmarks, lessons, progress, activity] = results;
  return {
    profile: profile.data,
    courses: courses.data || [],
    enrollments: enrollments.data || [],
    bookmarks: bookmarks.data || [],
    lessons: lessons.data || [],
    completedLessonIds: (progress.data || []).map((item) => item.lesson_id),
    activity: activity.data || [],
  };
}
