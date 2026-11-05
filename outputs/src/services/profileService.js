import { supabase } from "../lib/supabase";

export async function saveUserProfile(userId, fullName) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: fullName }, { onConflict: "id" });
  if (error) throw error;

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });
  if (authError) throw authError;

  return { id: userId, full_name: fullName };
}
