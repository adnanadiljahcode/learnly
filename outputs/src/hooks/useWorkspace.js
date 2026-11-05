import { useCallback, useEffect, useState } from "react";
import { fetchWorkspace } from "../services/workspaceService";
import { errorMessage } from "../utils/errorMessage";

export function useWorkspace(session, setError) {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settingsName, setSettingsName] = useState("");

  const loadWorkspace = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError("");
    try {
      const workspace = await fetchWorkspace(
        session.user.id,
        new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
      );
      setProfile(workspace.profile);
      setSettingsName(
        workspace.profile?.full_name || session.user.user_metadata?.full_name || "",
      );
      setCourses(workspace.courses);
      setEnrollments(workspace.enrollments);
      setBookmarks(workspace.bookmarks);
      setLessons(workspace.lessons);
      setCompletedLessonIds(workspace.completedLessonIds);
      setActivity(workspace.activity);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [session, setError]);

  useEffect(() => {
    if (session?.user) loadWorkspace();
  }, [session?.user?.id, loadWorkspace]);

  return {
    profile, setProfile,
    courses, setCourses,
    enrollments, setEnrollments,
    bookmarks, setBookmarks,
    lessons, setLessons,
    completedLessonIds, setCompletedLessonIds,
    activity, setActivity,
    loading, settingsName, setSettingsName,
    loadWorkspace,
  };
}
