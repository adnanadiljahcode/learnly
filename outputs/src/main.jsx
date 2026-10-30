import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Home, Compass, Bookmark, BarChart3, Settings, Search, Bell, ChevronDown,
  Clock3, Play, ArrowUpRight, Flame, Check, Code2, Palette, Megaphone,
  Menu, X, Plus, Sparkles, LogOut, LoaderCircle, BookOpen, RefreshCw,
  CheckCircle2, Circle, UserRound, AlertCircle
} from "lucide-react";
import { Auth } from "./Auth";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import "./style.css";

const nav = [
  { label: "Overview", icon: Home },
  { label: "Explore courses", icon: Compass },
  { label: "My bookmarks", icon: Bookmark },
  { label: "Progress", icon: BarChart3 },
];
const iconForTopic = (topic = "") => {
  const value = topic.toLowerCase();
  if (value.includes("design")) return Palette;
  if (value.includes("market")) return Megaphone;
  return Code2;
};
const formatMinutes = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
};
const getErrorMessage = (error) => error?.message || "Something went wrong. Please try again.";

function SetupRequired() {
  return <main className="auth-page"><section className="auth-card">
    <div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={18} /></span><span>learnly<span className="auth-brand-dot">.</span></span></div>
    <div className="auth-heading"><p className="auth-eyebrow">BACKEND SETUP REQUIRED</p><h1>Connect your Supabase project</h1>
      <p>Add your project credentials to <code>outputs/.env.local</code>, then restart Vite.</p></div>
    <pre className="setup-code">VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co{"\n"}VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY</pre>
    <p className="auth-switch">Then run <code>npm run dev -- --host 0.0.0.0</code>.</p>
  </section></main>;
}

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonBusy, setLessonBusy] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(getErrorMessage(sessionError));
      setSession(data?.session || null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError("");
    const userId = session.user.id;
    try {
      const results = await Promise.all([
        supabase.from("profiles").select("id,full_name").eq("id", userId).maybeSingle(),
        supabase.from("courses").select("id,title,topic,description,lessons_count,estimated_minutes,level").eq("is_published", true).order("created_at", { ascending: true }),
        supabase.from("enrollments").select("id,course_id,enrolled_at,completed_at").eq("user_id", userId),
        supabase.from("bookmarks").select("id,course_id").eq("user_id", userId),
        supabase.from("lessons").select("id,course_id,title,position,duration_minutes").order("position"),
        supabase.from("lesson_progress").select("lesson_id,completed_at").eq("user_id", userId),
        supabase.from("learning_activity").select("activity_date,minutes").eq("user_id", userId).gte("activity_date", new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)).order("activity_date")
      ]);
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
      const [profileResult, courseResult, enrollmentResult, bookmarkResult, lessonResult, progressResult, activityResult] = results;
      setProfile(profileResult.data);
      setSettingsName(profileResult.data?.full_name || session.user.user_metadata?.full_name || "");
      setCourses(courseResult.data || []);
      setEnrollments(enrollmentResult.data || []);
      setBookmarks(bookmarkResult.data || []);
      setLessons(lessonResult.data || []);
      setCompletedLessonIds((progressResult.data || []).map((item) => item.lesson_id));
      setActivity(activityResult.data || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { if (session?.user) loadWorkspace(); }, [session?.user?.id, loadWorkspace]);

  const enrolledCourseIds = useMemo(() => new Set(enrollments.map((item) => item.course_id)), [enrollments]);
  const bookmarkedCourseIds = useMemo(() => new Set(bookmarks.map((item) => item.course_id)), [bookmarks]);
  const coursesWithProgress = useMemo(() => courses.map((course) => {
    const courseLessonsList = lessons.filter((lesson) => lesson.course_id === course.id);
    const completed = courseLessonsList.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
    const enrollment = enrollments.find((item) => item.course_id === course.id);
    return { ...course, enrolled: Boolean(enrollment), enrollment, lessonTotal: courseLessonsList.length || course.lessons_count || 0,
      completed, progress: courseLessonsList.length ? Math.round(completed / courseLessonsList.length * 100) : 0 };
  }), [courses, lessons, completedLessonIds, enrollments]);
  const myCourses = coursesWithProgress.filter((course) => course.enrolled);
  const filteredCourses = coursesWithProgress.filter((course) => `${course.title} ${course.topic} ${course.description || ""}`.toLowerCase().includes(search.toLowerCase()));
  const savedCourses = coursesWithProgress.filter((course) => bookmarkedCourseIds.has(course.id));
  const totalMinutes = activity.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const completedCourses = myCourses.filter((course) => course.lessonTotal > 0 && course.progress === 100).length;
  const currentCourse = myCourses.find((course) => course.progress < 100) || myCourses[0];
  const userName = profile?.full_name || session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Learner";
  const notices = useMemo(() => [
    ...(currentCourse ? [`Continue ${currentCourse.title} whenever you're ready.`] : ["Explore courses and enroll to start learning."]),
    ...(totalMinutes < 120 ? ["A short study session today will help build your weekly habit."] : ["Great work keeping your learning activity up."])
  ], [currentCourse?.id, totalMinutes]);

  async function toggleBookmark(course) {
    setError(""); setSuccess("");
    const existing = bookmarks.find((item) => item.course_id === course.id);
    try {
      if (existing) {
        const { error: removeError } = await supabase.from("bookmarks").delete().eq("id", existing.id).eq("user_id", session.user.id);
        if (removeError) throw removeError;
        setBookmarks((items) => items.filter((item) => item.id !== existing.id));
      } else {
        const { data, error: addError } = await supabase.from("bookmarks").insert({ user_id: session.user.id, course_id: course.id }).select("id,course_id").single();
        if (addError) throw addError;
        setBookmarks((items) => [...items, data]);
      }
    } catch (actionError) { setError(getErrorMessage(actionError)); }
  }

  async function enroll(course) {
    setError(""); setSuccess("");
    try {
      const { data, error: enrollError } = await supabase.from("enrollments").insert({ user_id: session.user.id, course_id: course.id }).select("id,course_id,enrolled_at,completed_at").single();
      if (enrollError) throw enrollError;
      setEnrollments((items) => [...items, data]);
      setSuccess(`You're enrolled in ${course.title}.`);
      setActive("Overview");
    } catch (actionError) { setError(getErrorMessage(actionError)); }
  }

  async function openCourse(course) {
    setSelectedCourse(course); setCourseLessons([]); setError("");
    const { data, error: lessonsError } = await supabase.from("lessons").select("id,course_id,title,position,duration_minutes,content").eq("course_id", course.id).order("position");
    if (lessonsError) setError(getErrorMessage(lessonsError));
    else setCourseLessons(data || []);
  }

  async function completeLesson(lesson) {
    setLessonBusy(true); setError(""); setSuccess("");
    try {
      const { error: progressError } = await supabase.from("lesson_progress").upsert(
        { user_id: session.user.id, lesson_id: lesson.id, completed_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      );
      if (progressError) throw progressError;
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing, error: activityReadError } = await supabase.from("learning_activity").select("id,minutes").eq("user_id", session.user.id).eq("activity_date", today).maybeSingle();
      if (activityReadError) throw activityReadError;
      const minutes = Math.max(1, Number(lesson.duration_minutes || 15));
      const activityWrite = existing
        ? await supabase.from("learning_activity").update({ minutes: Number(existing.minutes || 0) + minutes }).eq("id", existing.id)
        : await supabase.from("learning_activity").insert({ user_id: session.user.id, activity_date: today, minutes });
      if (activityWrite.error) throw activityWrite.error;
      setCompletedLessonIds((ids) => ids.includes(lesson.id) ? ids : [...ids, lesson.id]);
      setSuccess("Lesson marked complete. Your progress has been updated.");
      await loadWorkspace();
    } catch (actionError) { setError(getErrorMessage(actionError)); }
    finally { setLessonBusy(false); }
  }

  async function saveProfile(event) {
    event.preventDefault(); setSavingProfile(true); setError(""); setSuccess("");
    try {
      const { error: saveError } = await supabase.from("profiles").upsert({ id: session.user.id, full_name: settingsName.trim() }, { onConflict: "id" });
      if (saveError) throw saveError;
      await supabase.auth.updateUser({ data: { full_name: settingsName.trim() } });
      setProfile({ id: session.user.id, full_name: settingsName.trim() });
      setSuccess("Your profile has been saved.");
    } catch (saveError) { setError(getErrorMessage(saveError)); }
    finally { setSavingProfile(false); }
  }

  async function signOut() { await supabase.auth.signOut(); setActive("Overview"); }

  if (!isSupabaseConfigured) return <SetupRequired />;
  if (!authReady) return <main className="auth-page"><div className="loading-state"><LoaderCircle className="spin" /> Connecting to Learnly…</div></main>;
  if (!session) return <Auth onSignedIn={() => {}} />;

  const displayCourses = active === "My bookmarks" ? savedCourses : active === "Explore courses" ? filteredCourses : active === "Overview" ? myCourses : [];
  const activityByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const item = activity.find((row) => row.activity_date === key);
    return { label: date.toLocaleDateString(undefined, { weekday: "short" }), minutes: Number(item?.minutes || 0) };
  });
  const maxActivity = Math.max(60, ...activityByDay.map((item) => item.minutes));

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setActive("Overview"); }}><span className="brand-mark"><Sparkles size={19} fill="currentColor" /></span><span>learnly<span className="brand-dot">.</span></span></a>
      <div className="side-label">WORKSPACE</div>
      <nav className="side-nav">{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? "selected" : ""}`} onClick={() => { setActive(label); setSearch(""); setMenuOpen(false); }}><Icon size={18} /><span>{label}</span>{label === "My bookmarks" && <span className="nav-count">{bookmarks.length}</span>}</button>)}</nav>
      <div className="side-label discover-label">YOUR LEARNING</div>
      <div className="learning-box"><div className="learning-top"><span className="learning-icon"><Flame size={15} fill="currentColor" /></span><span>Weekly goal</span><span className="goal-count">{Math.min(6, Math.round(totalMinutes / 60))}/6h</span></div><div className="goal-track"><span style={{ width: `${Math.min(100, totalMinutes / 360 * 100)}%` }} /></div><div className="goal-caption">{formatMinutes(Math.max(0, 360 - totalMinutes))} to reach your 6-hour goal</div></div>
      <div className="sidebar-bottom"><button className={`nav-item ${active === "Settings" ? "selected" : ""}`} onClick={() => { setActive("Settings"); setMenuOpen(false); }}><Settings size={18} /><span>Settings</span></button><div className="side-profile"><div className="avatar avatar-small">{userName.slice(0, 1).toUpperCase()}</div><div className="profile-copy"><strong>{userName}</strong><span>{session.user.email}</span></div><button className="profile-logout" title="Sign out" onClick={signOut}><LogOut size={15} /></button></div></div>
    </aside>
    {menuOpen && <button aria-label="Close menu" className="scrim" onClick={() => setMenuOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <div className="breadcrumb">My workspace <span>/</span> <strong>{active}</strong></div>
        <div className="top-actions"><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses..." /><kbd>⌕</kbd></label>
          <div className="notice-wrap"><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNoticeOpen(!noticeOpen)}><Bell size={18} /><span className="notification-dot" /></button>
            {noticeOpen && <div className="notice-popover"><div className="notice-heading">Notifications <button onClick={() => setNoticeOpen(false)}>Close</button></div>{notices.map((notice, index) => <div className="notice-row" key={index}><span className="notice-bullet" /><span>{notice}</span></div>)}</div>}
          </div><div className="avatar">{userName.slice(0, 1).toUpperCase()}</div>
        </div>
      </header>
      <div className="content">
        {error && <div className="workspace-alert error-alert" role="alert"><AlertCircle size={16} />{error}<button onClick={() => setError("")}><X size={15} /></button></div>}
        {success && <div className="workspace-alert success-alert" role="status"><CheckCircle2 size={16} />{success}<button onClick={() => setSuccess("")}><X size={15} /></button></div>}
        {loading && <div className="loading-banner"><LoaderCircle className="spin" size={16} /> Syncing your learning workspace…</div>}
        {active === "Overview" && <>
          <section className="welcome-row"><div><div className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</div><h1>Welcome back, {userName} <span className="wave">✦</span></h1><p className="welcome-sub">A little progress each day adds up to big results.</p></div><div className="streak-pill"><span className="streak-flame"><Flame size={17} fill="currentColor" /></span><strong>{activity.filter((item) => item.minutes > 0).length} active days this week</strong></div></section>
          <section className="hero-card"><div className="hero-copy"><div className="hero-kicker"><span className="live-dot" /> PICK UP WHERE YOU LEFT OFF</div><h2>{currentCourse ? currentCourse.title : "Your next chapter starts here"}<br />{currentCourse ? "Keep your momentum" : "Find something to learn"}</h2><p>{currentCourse ? `${currentCourse.completed} of ${currentCourse.lessonTotal} lessons completed` : "Explore the course library and enroll in your first course."}</p><div className="hero-bottom"><button className="continue-button" onClick={() => currentCourse ? openCourse(currentCourse) : setActive("Explore courses")}><Play size={15} fill="currentColor" />{currentCourse ? "Continue learning" : "Explore courses"}</button>{currentCourse && <span className="hero-duration"><Clock3 size={15} />{formatMinutes(currentCourse.estimated_minutes || 0)} total</span>}</div></div><div className="hero-art"><div className="art-sun" /><div className="art-tile tile-back" /><div className="art-tile tile-front"><span>make<br />it <i>matter</i><b>✳</b></span></div><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-spark spark-a">✳</div><div className="art-spark spark-b">✦</div></div><div className="hero-progress"><span style={{ width: `${currentCourse?.progress || 0}%` }} /></div></section>
          <section className="stats-grid"><article className="stat-card"><div className="stat-icon indigo"><Clock3 size={18} /></div><div className="stat-meta">LEARNING TIME · 7 DAYS</div><div className="stat-main">{(totalMinutes / 60).toFixed(1)} <span>hrs</span></div><div className="stat-foot">Recorded study time this week</div><div className="mini-bars">{activityByDay.map((day, index) => <span key={day.label} title={`${day.label}: ${formatMinutes(day.minutes)}`} style={{ height: `${Math.max(5, day.minutes / maxActivity * 100)}%` }} className={index === 6 ? "bar-highlight" : ""} />)}</div></article>
            <article className="stat-card"><div className="stat-icon orange"><Flame size={18} /></div><div className="stat-meta">ACTIVE DAYS · 7 DAYS</div><div className="stat-main">{activityByDay.filter((day) => day.minutes > 0).length} <span>days</span></div><div className="stat-foot">Days with recorded learning</div><div className="streak-week">{activityByDay.map((day) => <span key={day.label} className={day.minutes > 0 ? "day-done" : ""}>{day.minutes > 0 ? <Check size={12} /> : day.label.slice(0, 1)}</span>)}</div></article>
            <article className="stat-card"><div className="stat-icon green"><Check size={18} /></div><div className="stat-meta">COURSES COMPLETED</div><div className="stat-main">{completedCourses} <span>courses</span></div><div className="stat-foot">{myCourses.length} courses enrolled</div><div className="completion-track"><span style={{ width: myCourses.length ? `${completedCourses / myCourses.length * 100}%` : "0%" }} /></div><div className="completion-label"><span>Completion rate</span><strong>{myCourses.length ? Math.round(completedCourses / myCourses.length * 100) : 0}%</strong></div></article></section>
        </>}
        {active === "Explore courses" && <section className="page-intro"><div className="eyebrow">GROW YOUR SKILLS</div><h1>Explore courses</h1><p className="welcome-sub">Discover a course and add it to your learning plan.</p></section>}
        {active === "My bookmarks" && <section className="page-intro"><div className="eyebrow">SAVED FOR LATER</div><h1>My bookmarks</h1><p className="welcome-sub">Courses you've saved for another day.</p></section>}
        {active === "Progress" && <section className="page-intro"><div className="eyebrow">YOUR CONSISTENCY</div><h1>Learning progress</h1><p className="welcome-sub">A live view of your enrolled courses and recorded study time.</p><div className="progress-summary"><div><strong>{myCourses.length}</strong><span>Enrolled courses</span></div><div><strong>{completedCourses}</strong><span>Completed courses</span></div><div><strong>{formatMinutes(totalMinutes)}</strong><span>Study time this week</span></div></div></section>}
        {active === "Settings" && <section className="page-intro"><div className="eyebrow">YOUR ACCOUNT</div><h1>Settings</h1><p className="welcome-sub">Manage your Learnly profile and account.</p><form className="settings-form" onSubmit={saveProfile}><label htmlFor="profile-name">Display name</label><input id="profile-name" value={settingsName} onChange={(event) => setSettingsName(event.target.value)} maxLength={80} placeholder="Your name" /><label>Email address</label><input value={session.user.email || ""} disabled /><button className="continue-button" type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save profile"}</button><button className="secondary-action" type="button" onClick={signOut}><LogOut size={15} /> Sign out</button></form></section>}
        {["Overview", "Explore courses", "My bookmarks"].includes(active) && <section className="courses-section"><div className="section-heading"><div><div className="eyebrow">{active === "Explore courses" ? "FIND YOUR NEXT SKILL" : active === "My bookmarks" ? "YOUR SAVED LIST" : "KEEP THE MOMENTUM"}</div><h2>{active === "Explore courses" ? "Course library" : active === "My bookmarks" ? "Saved courses" : "Your courses"} <span className="course-count">{displayCourses.length}</span></h2></div>{active === "Overview" && <button className="text-link" onClick={() => setActive("Explore courses")}>Explore all <ArrowUpRight size={15} /></button>}</div>
          <div className="course-grid">{displayCourses.map((course) => { const Icon = iconForTopic(course.topic); const saved = bookmarkedCourseIds.has(course.id); return <article className="course-card" key={course.id}><div className={`course-cover ${course.topic?.toLowerCase().includes("design") ? "lilac" : course.topic?.toLowerCase().includes("market") ? "peach" : "mint"}`}><div className="cover-orb orb-one" /><div className="cover-orb orb-two" /><span className="cover-glyph">{course.topic?.toLowerCase().includes("design") ? "✳" : course.topic?.toLowerCase().includes("market") ? "◉" : "⌘"}</span><div className="cover-type"><Icon size={13} />{course.topic || "LEARNING"}</div><button className={`save-button ${saved ? "is-saved" : ""}`} aria-label={saved ? "Remove bookmark" : "Save course"} onClick={() => toggleBookmark(course)}><Bookmark size={15} fill={saved ? "currentColor" : "none"} /></button></div><div className="course-info"><h3>{course.title}</h3><p className="course-description">{course.description || "Build practical skills with this guided course."}</p><div className="course-meta"><span>{course.completed} of {course.lessonTotal} lessons</span><span><Clock3 size={13} />{formatMinutes(course.estimated_minutes || 0)}</span></div><div className="course-progress"><span style={{ width: `${course.progress}%` }} /></div><div className="progress-label"><span>{course.enrolled ? "Progress" : course.level || "Not enrolled"}</span><strong>{course.enrolled ? `${course.progress}%` : "Explore"}</strong></div><div className="course-actions">{course.enrolled ? <button className="course-action-primary" onClick={() => openCourse(course)}><Play size={14} /> Open course</button> : <button className="course-action-primary" onClick={() => enroll(course)}><Plus size={14} /> Enroll now</button>}<button className="course-action-secondary" onClick={() => openCourse(course)}>Details</button></div></div></article>; })}{displayCourses.length === 0 && <div className="empty-state"><BookOpen size={26} /><h3>{active === "My bookmarks" ? "No bookmarks yet" : active === "Overview" ? "Your learning journey starts here" : "No courses found"}</h3><p>{active === "My bookmarks" ? "Save courses with the bookmark icon to find them here." : active === "Overview" ? "Explore the course library and enroll in a course to see it on your Overview." : "Try another search, or check back later."}</p>{active !== "My bookmarks" && <button className="continue-button" onClick={() => { setSearch(""); setActive("Explore courses"); }}>Explore courses</button>}</div>}</div>
        </section>}
        {active === "Progress" && <section className="courses-section"><div className="section-heading"><div><div className="eyebrow">COURSE BREAKDOWN</div><h2>Your course progress</h2></div></div><div className="progress-list">{myCourses.map((course) => <div className="progress-row" key={course.id}><div><strong>{course.title}</strong><span>{course.completed} / {course.lessonTotal} lessons completed</span></div><div className="progress-row-track"><span style={{ width: `${course.progress}%` }} /></div><b>{course.progress}%</b></div>)}{!myCourses.length && <p className="empty-copy">Enroll in a course to start tracking your progress.</p>}</div><div className="activity-card activity-card-full"><div className="section-heading compact"><div><div className="eyebrow">LAST 7 DAYS</div><h2>Learning activity</h2></div></div><div className="activity-bars">{activityByDay.map((day) => <div key={day.label}><div className="activity-bar-wrap"><span style={{ height: `${Math.max(3, day.minutes / maxActivity * 100)}%` }} title={formatMinutes(day.minutes)} /></div><small>{day.label}</small><b>{day.minutes ? formatMinutes(day.minutes) : "—"}</b></div>)}</div></div></section>}
        {active === "Overview" && <section className="bottom-grid"><article className="activity-card"><div className="section-heading compact"><div><div className="eyebrow">YOUR CONSISTENCY</div><h2>Learning activity</h2></div><button className="select-button" onClick={() => setActive("Progress")}>View progress <ArrowUpRight size={14} /></button></div><div className="activity-bars">{activityByDay.map((day) => <div key={day.label}><div className="activity-bar-wrap"><span style={{ height: `${Math.max(3, day.minutes / maxActivity * 100)}%` }} title={formatMinutes(day.minutes)} /></div><small>{day.label}</small><b>{day.minutes ? formatMinutes(day.minutes) : "—"}</b></div>)}</div></article><article className="tip-card"><div className="tip-icon"><Sparkles size={17} /></div><div className="eyebrow">A LITTLE REMINDER</div><h3>Small steps count.</h3><p>Even 15 minutes of focused learning today moves you closer to your goals.</p><div className="tip-footer"><span>YOUR DAILY BOOST</span><span>✦ &nbsp;01 / 05</span></div></article></section>}
        <footer className="footer"><span>© {new Date().getFullYear()} Learnly</span><span>Made for curious minds <span className="footer-heart">♥</span></span></footer>
      </div>
    </main>
    {selectedCourse && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedCourse(null); }}><section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title"><div className="modal-heading"><div><div className="eyebrow">COURSE DETAILS</div><h2 id="course-modal-title">{selectedCourse.title}</h2></div><button className="icon-button" onClick={() => setSelectedCourse(null)} aria-label="Close course"><X size={19} /></button></div><p>{selectedCourse.description || "Follow the lessons below and track your learning progress."}</p>{!selectedCourse.enrolled && <button className="continue-button" onClick={() => enroll(selectedCourse)}><Plus size={14} /> Enroll in course</button>}<div className="lesson-list">{courseLessons.map((lesson) => { const done = completedLessonIds.includes(lesson.id); return <article className="lesson-row" key={lesson.id}><div className="lesson-status">{done ? <CheckCircle2 size={19} /> : <Circle size={19} />}</div><div className="lesson-copy"><strong>{lesson.position}. {lesson.title}</strong><span>{formatMinutes(lesson.duration_minutes || 0)}</span>{lesson.content && <p>{lesson.content}</p>}</div>{selectedCourse.enrolled && <button disabled={done || lessonBusy} className="lesson-complete" onClick={() => completeLesson(lesson)}>{done ? "Completed" : lessonBusy ? "Saving…" : "Mark complete"}</button>}</article>; })}{courseLessons.length === 0 && <p className="empty-copy">No lessons have been added to this course yet.</p>}</div></section></div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
