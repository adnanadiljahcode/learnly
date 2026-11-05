import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";
import {
  Sparkles,
  LoaderCircle,
} from "lucide-react";
import { Auth } from "../Auth";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import CourseModal from "../components/CourseModal";
import WorkspaceAlerts from "../components/WorkspaceAlerts";
import Overview from "../pages/Overview";
import ExploreCourses from "../pages/ExploreCourses";
import Bookmarks from "../pages/Bookmarks";
import Progress from "../pages/Progress";
import SettingsPage from "../pages/Settings";
import { errorMessage } from "../utils/errorMessage";
import { addBookmark, removeBookmark, createEnrollment, fetchCourseLessons } from "../services/courseService";
import { recordLessonCompletion } from "../services/learningService";
import { saveUserProfile } from "../services/profileService";

const routeTitles = {
  "/overview": "Overview",
  "/explore": "Explore courses",
  "/bookmarks": "My bookmarks",
  "/progress": "Progress",
  "/settings": "Settings",
};

function SetupRequired() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <Sparkles size={18} />
          </span>
          <span>
            learnly<span className="auth-brand-dot">.</span>
          </span>
        </div>
        <div className="auth-heading">
          <p className="auth-eyebrow">BACKEND SETUP REQUIRED</p>
          <h1>Connect your Supabase project</h1>
          <p>
            Add your project credentials to <code>outputs/.env.local</code>,
            then restart Vite.
          </p>
        </div>
        <pre className="setup-code">
          VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co{"\n"}
          VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
        </pre>
        <p className="auth-switch">
          Then run <code>npm run dev -- --host 0.0.0.0</code>.
        </p>
      </section>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(() =>
    routeTitles[window.location.pathname]
      ? window.location.pathname
      : "/overview",
  );
  const { session, authReady, authError } = useAuth();
  const [search, setSearch] = useState(""),
    [noticeOpen, setNoticeOpen] = useState(false),
    [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);
  const {
    profile, setProfile, courses, setCourses, enrollments, setEnrollments,
    bookmarks, setBookmarks, lessons, completedLessonIds, setCompletedLessonIds,
    activity, loading, settingsName, setSettingsName, loadWorkspace,
  } = useWorkspace(session, setError);
  const [selectedCourse, setSelectedCourse] = useState(null),
    [courseLessons, setCourseLessons] = useState([]),
    [lessonBusy, setLessonBusy] = useState(false),
    [savingProfile, setSavingProfile] = useState(false);

  const navigate = useCallback((to) => {
    const next = routeTitles[to] ? to : "/overview";
    if (window.location.pathname !== next)
      window.history.pushState({}, "", next);
    setPath(next);
    setSelectedCourse(null);
    setSearch("");
    setMenuOpen(false);
    setNoticeOpen(false);
  }, []);
  useEffect(() => {
    const onPop = () => {
      setPath(
        routeTitles[window.location.pathname]
          ? window.location.pathname
          : "/overview",
      );
      setSearch("");
    };
    window.addEventListener("popstate", onPop);
    if (!routeTitles[window.location.pathname])
      window.history.replaceState({}, "", "/overview");
    return () => window.removeEventListener("popstate", onPop);
  }, []);



  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((x) => x.course_id)),
    [bookmarks],
  );
  const coursesWithProgress = useMemo(
    () =>
      courses.map((course) => {
        const ls = lessons.filter((x) => x.course_id === course.id),
          completed = ls.filter((x) =>
            completedLessonIds.includes(x.id),
          ).length,
          enrollment = enrollments.find((x) => x.course_id === course.id);
        return {
          ...course,
          enrolled: Boolean(enrollment),
          enrollment,
          lessonTotal: ls.length || course.lessons_count || 0,
          completed,
          progress: ls.length ? Math.round((completed / ls.length) * 100) : 0,
        };
      }),
    [courses, lessons, completedLessonIds, enrollments],
  );
  const myCourses = coursesWithProgress.filter((c) => c.enrolled),
    savedCourses = coursesWithProgress.filter((c) => bookmarkedIds.has(c.id));
  const filteredCourses = coursesWithProgress.filter((c) =>
    `${c.title} ${c.topic || ""} ${c.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const totalMinutes = activity.reduce(
      (sum, x) => sum + Number(x.minutes || 0),
      0,
    ),
    completedCourses = myCourses.filter(
      (c) => c.lessonTotal > 0 && c.progress === 100,
    ).length,
    currentCourse = myCourses.find((c) => c.progress < 100) || myCourses[0];
  const userName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "Learner";
  const activityByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10),
      item = activity.find((x) => x.activity_date === key);
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      minutes: Number(item?.minutes || 0),
    };
  });
  const maxActivity = Math.max(60, ...activityByDay.map((x) => x.minutes));
  const notices = [
    currentCourse
      ? `Continue ${currentCourse.title} whenever you're ready.`
      : "Explore courses and enroll to start learning.",
    totalMinutes < 120
      ? "A short study session today will help build your weekly habit."
      : "Great work keeping your learning activity up.",
  ];

  async function toggleBookmark(course) {
    setError("");
    setSuccess("");
    const existing = bookmarks.find((x) => x.course_id === course.id);
    try {
      if (existing) {
        await removeBookmark(session.user.id, existing.id);
        setBookmarks((items) => items.filter((x) => x.id !== existing.id));
      } else {
        const data = await addBookmark(session.user.id, course.id);
        setBookmarks((items) => [...items, data]);
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function enroll(course) {
    setError("");
    setSuccess("");
    try {
      const data = await createEnrollment(session.user.id, course.id);
      setEnrollments((items) => [...items, data]);
      setSuccess(`You're enrolled in ${course.title}.`);
      navigate("/overview");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function openCourse(course) {
    setSelectedCourse(course);
    setCourseLessons([]);
    setError("");
    try {
      const data = await fetchCourseLessons(course.id);
      setCourseLessons(data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function completeLesson(lesson) {
    setLessonBusy(true);
    setError("");
    setSuccess("");
    try {
      const recorded = await recordLessonCompletion(session.user.id, lesson);
      setCompletedLessonIds((ids) =>
        ids.includes(lesson.id) ? ids : [...ids, lesson.id],
      );
      setSuccess(
        recorded
          ? "Lesson marked complete. Your progress has been updated."
          : "This lesson was already completed. Your progress is up to date.",
      );
      await loadWorkspace();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLessonBusy(false);
    }
  }
  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setSuccess("");
    try {
      const savedProfile = await saveUserProfile(
        session.user.id,
        settingsName.trim(),
      );
      setProfile(savedProfile);
      setSuccess("Your profile has been saved.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSavingProfile(false);
    }
  }
  async function signOut() {
    await supabase.auth.signOut();
    navigate("/overview");
  }

  if (!isSupabaseConfigured) return <SetupRequired />;
  if (!authReady)
    return (
      <main className="auth-page">
        <div className="loading-state">
          <LoaderCircle className="spin" /> Connecting to Learnly…
        </div>
      </main>
    );
  if (!session) return <Auth />;

  const shared = {
    bookmarkedIds,
    onToggleBookmark: toggleBookmark,
    onOpenCourse: openCourse,
    onEnroll: enroll,
    onNavigate: navigate,
  };
  const page =
    path === "/explore" ? (
      <ExploreCourses courses={filteredCourses} {...shared} />
    ) : path === "/bookmarks" ? (
      <Bookmarks courses={savedCourses} {...shared} />
    ) : path === "/progress" ? (
      <Progress
        myCourses={myCourses}
        completedCourses={completedCourses}
        totalMinutes={totalMinutes}
        activityByDay={activityByDay}
        maxActivity={maxActivity}
      />
    ) : path === "/settings" ? (
      <SettingsPage
        settingsName={settingsName}
        onNameChange={setSettingsName}
        email={session.user.email}
        onSave={saveProfile}
        savingProfile={savingProfile}
        onSignOut={signOut}
      />
    ) : (
      <Overview
        userName={userName}
        myCourses={myCourses}
        currentCourse={currentCourse}
        totalMinutes={totalMinutes}
        completedCourses={completedCourses}
        activityByDay={activityByDay}
        maxActivity={maxActivity}
        {...shared}
      />
    );

  return (
    <div className="app-shell">
      <Sidebar
        path={path}
        userName={userName}
        email={session.user.email}
        bookmarkCount={bookmarks.length}
        totalMinutes={totalMinutes}
        onSignOut={signOut}
        open={menuOpen}
        onNavigate={navigate}
      />
      <main className="main-area">
        <Header
          title={routeTitles[path]}
          search={search}
          onSearch={(e) => setSearch(e.target.value)}
          noticeOpen={noticeOpen}
          onToggleNotice={() => setNoticeOpen((v) => !v)}
          notices={notices}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((v) => !v)}
          userName={userName}
          onNavigate={navigate}
        />
        <div className="content">
          <WorkspaceAlerts
            error={error}
            success={success}
            loading={loading}
            onClearError={() => setError("")}
            onClearSuccess={() => setSuccess("")}
          />
          {page}
          <footer className="footer text-sm">
            <span>© {new Date().getFullYear()} Learnly</span>
            <span className="font-semibold">adnan.adil.jah+learnly@gmail.com</span>
            <span>
              Made for curious minds <span className="footer-heart">♥</span>
            </span>
          </footer>
        </div>
      </main>
      <CourseModal
        course={selectedCourse}
        lessons={courseLessons}
        completedLessonIds={completedLessonIds}
        lessonBusy={lessonBusy}
        onClose={() => setSelectedCourse(null)}
        onEnroll={enroll}
        onCompleteLesson={completeLesson}
      />
    </div>
  );
}

export default App;
