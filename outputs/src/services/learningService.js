import { supabase } from "../lib/supabase";

export async function recordLessonCompletion(userId, lesson) {
  const { error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: userId,
        lesson_id: lesson.id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const { data: existing, error: readError } = await supabase
    .from("learning_activity")
    .select("id,minutes")
    .eq("user_id", userId)
    .eq("activity_date", today)
    .maybeSingle();
  if (readError) throw readError;

  const minutes = Math.max(1, Number(lesson.duration_minutes || 15));
  const write = existing
    ? await supabase
        .from("learning_activity")
        .update({ minutes: Number(existing.minutes || 0) + minutes })
        .eq("id", existing.id)
    : await supabase.from("learning_activity").insert({
        user_id: userId,
        activity_date: today,
        minutes,
      });
  if (write.error) throw write.error;
}
