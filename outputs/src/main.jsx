import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Home,
  Compass,
  Bookmark,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Clock3,
  Play,
  ArrowUpRight,
  Flame,
  Check,
  Code2,
  Palette,
  Megaphone,
  Database,
  Menu,
  X,
  Plus,
  Sparkles,
} from "lucide-react";
import "./style.css";

const courses = [
  {
    id: 1,
    title: "UI Design Fundamentals",
    topic: "DESIGN",
    lessons: "12 of 18 lessons",
    progress: 68,
    time: "4h 20m left",
    icon: Palette,
    color: "lilac",
    art: "✳",
  },
  {
    id: 2,
    title: "JavaScript: The Essentials",
    topic: "DEVELOPMENT",
    lessons: "8 of 24 lessons",
    progress: 34,
    time: "8h 10m left",
    icon: Code2,
    color: "mint",
    art: "⌘",
  },
  {
    id: 3,
    title: "Brand Strategy 101",
    topic: "MARKETING",
    lessons: "3 of 10 lessons",
    progress: 30,
    time: "2h 45m left",
    icon: Megaphone,
    color: "peach",
    art: "◉",
  },
];
const nav = [
  { label: "Overview", icon: Home },
  { label: "Explore courses", icon: Compass },
  { label: "My bookmarks", icon: Bookmark },
  { label: "Progress", icon: BarChart3 },
];
const initialNotices = [
  "Your next lesson is ready when you are.",
  "You are 2 days away from your weekly goal.",
];

function App() {
  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [notices, setNotices] = useState(initialNotices);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState([1]);
  const [showAll, setShowAll] = useState(false);
  const visibleCourses = courses.filter((c) =>
    `${c.title} ${c.topic}`.toLowerCase().includes(search.toLowerCase()),
  );
  const dismissNotice = () => setNotices([]);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#home" onClick={() => setActive("Overview")}>
          <span className="brand-mark">
            <Sparkles size={19} fill="currentColor" />
          </span>
          <span>
            learnly<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "selected" : ""}`}
              onClick={() => {
                setActive(label);
                setMenuOpen(false);
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "My bookmarks" && (
                <span className="nav-count">{saved.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="side-label discover-label">YOUR LEARNING</div>
        <div className="learning-box">
          <div className="learning-top">
            <span className="learning-icon">
              <Flame size={15} fill="currentColor" />
            </span>
            <span>Weekly goal</span>
            <span className="goal-count">4/6</span>
          </div>
          <div className="goal-track">
            <span />
          </div>
          <div className="goal-caption">2 more hours to hit your goal</div>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setActive("Settings")}>
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </button>
          <div className="side-profile">
            <div className="avatar avatar-small">JD</div>
            <div className="profile-copy">
              <strong>Jordan Davis</strong>
              <span>Free plan</span>
            </div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>
      {menuOpen && (
        <button
          aria-label="Close menu"
          className="scrim"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="breadcrumb">
            My workspace <span>/</span> <strong>{active}</strong>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActive("Overview");
                }}
                placeholder="Search anything..."
              />
              <kbd>⌘ K</kbd>
            </label>
            <div className="notice-wrap">
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                onClick={() => setNoticeOpen(!noticeOpen)}
              >
                <Bell size={18} />
                {notices.length > 0 && <span className="notification-dot" />}
              </button>
              {noticeOpen && (
                <div className="notice-popover">
                  <div className="notice-heading">
                    Notifications{" "}
                    <button onClick={dismissNotice}>Clear all</button>
                  </div>
                  {notices.length ? (
                    notices.map((n, i) => (
                      <div className="notice-row" key={i}>
                        <span className="notice-bullet" />
                        <span>{n}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-notices">You're all caught up ✨</div>
                  )}
                </div>
              )}
            </div>
            <div className="avatar">JD</div>
          </div>
        </header>
        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">TUESDAY, OCTOBER 21, 2026</div>
              <h1>
                {active === "Overview" ? (
                  <>
                    Good morning, Jordan <span className="wave">✦</span>
                  </>
                ) : (
                  active
                )}
              </h1>
              <p className="welcome-sub">
                {active === "Overview"
                  ? "A little progress each day adds up to big results."
                  : `Pick up where you left off or discover something new.`}
              </p>
            </div>
            <button className="streak-pill">
              <span className="streak-flame">
                <Flame size={17} fill="currentColor" />
              </span>
              <strong>5 day streak</strong>
              <span className="streak-divider" /> <span>🔥</span>
            </button>
          </section>
          <section className="hero-card">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="live-dot" /> PICK UP WHERE YOU LEFT OFF
              </div>
              <h2>
                Designing with
                <br />
                purpose & clarity
              </h2>
              <p>
                UI Design Fundamentals <span>·</span> Lesson 13 of 18
              </p>
              <div className="hero-bottom">
                <button
                  className="continue-button"
                  onClick={() => alert("Lesson 13 is ready to continue!")}
                >
                  <Play size={15} fill="currentColor" /> Continue learning
                </button>
                <span className="hero-duration">
                  <Clock3 size={15} /> 18 min left
                </span>
              </div>
            </div>
            <div className="hero-art">
              <div className="art-sun" />
              <div className="art-tile tile-back" />
              <div className="art-tile tile-front">
                <span>
                  make
                  <br />
                  it <i>matter</i>
                  <b>✳</b>
                </span>
              </div>
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-spark spark-a">✳</div>
              <div className="art-spark spark-b">✦</div>
            </div>
            <div className="hero-progress">
              <span />
            </div>
          </section>
          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-icon indigo">
                <Clock3 size={18} />
              </div>
              <div className="stat-meta">LEARNING TIME</div>
              <div className="stat-main">
                12.5 <span>hrs</span>
                <span className="stat-delta">↗ 18%</span>
              </div>
              <div className="stat-foot">vs. last week</div>
              <div className="mini-bars">
                {[33, 52, 43, 70, 49, 84, 60, 100, 72, 89, 57, 78].map(
                  (h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}%` }}
                      className={i === 9 ? "bar-highlight" : ""}
                    />
                  ),
                )}
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-icon orange">
                <Flame size={18} />
              </div>
              <div className="stat-meta">CURRENT STREAK</div>
              <div className="stat-main">
                5 <span>days</span>
                <span className="stat-delta">Personal best: 12</span>
              </div>
              <div className="stat-foot">You're building a great habit</div>
              <div className="streak-week">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className={i < 4 ? "day-done" : ""}>
                    {i < 4 ? <Check size={12} /> : d}
                  </span>
                ))}
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-icon green">
                <Check size={18} />
              </div>
              <div className="stat-meta">COURSES COMPLETED</div>
              <div className="stat-main">
                3 <span>courses</span>
              </div>
              <div className="stat-foot">2 more to reach your goal</div>
              <div className="completion-track">
                <span />
              </div>
              <div className="completion-label">
                <span>2026 goal</span>
                <strong>3 of 5</strong>
              </div>
            </article>
          </section>
          <section className="courses-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">KEEP THE MOMENTUM</div>
                <h2>
                  {active === "My bookmarks"
                    ? "Your saved courses"
                    : search
                      ? "Search results"
                      : "Your courses"}{" "}
                  <span className="course-count">{visibleCourses.length}</span>
                </h2>
              </div>
              <button
                className="text-link"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : "View all"} <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="course-grid">
              {visibleCourses
                .slice(0, showAll ? courses.length : 3)
                .map((course) => {
                  const Icon = course.icon;
                  return (
                    <article className="course-card" key={course.id}>
                      <div className={`course-cover ${course.color}`}>
                        <div className="cover-orb orb-one" />
                        <div className="cover-orb orb-two" />
                        <span className="cover-glyph">{course.art}</span>
                        <div className="cover-type">
                          <Icon size={13} />
                          {course.topic}
                        </div>
                        <button
                          className={`save-button ${saved.includes(course.id) ? "is-saved" : ""}`}
                          aria-label={
                            saved.includes(course.id)
                              ? "Remove bookmark"
                              : "Save course"
                          }
                          onClick={() =>
                            setSaved(
                              saved.includes(course.id)
                                ? saved.filter((id) => id !== course.id)
                                : [...saved, course.id],
                            )
                          }
                        >
                          <Bookmark
                            size={15}
                            fill={
                              saved.includes(course.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>
                      <div className="course-info">
                        <h3>{course.title}</h3>
                        <div className="course-meta">
                          <span>{course.lessons}</span>
                          <span>
                            <Clock3 size={13} />
                            {course.time}
                          </span>
                        </div>
                        <div className="course-progress">
                          <span style={{ width: `${course.progress}%` }} />
                        </div>
                        <div className="progress-label">
                          <span>Progress</span>
                          <strong>{course.progress}%</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              {visibleCourses.length === 0 && (
                <div className="no-results">
                  No courses found. Try another search.
                </div>
              )}
            </div>
          </section>
          <section className="bottom-grid">
            <article className="activity-card">
              <div className="section-heading compact">
                <div>
                  <div className="eyebrow">YOUR CONSISTENCY</div>
                  <h2>Learning activity</h2>
                </div>
                <button
                  className="select-button"
                  onClick={(e) =>
                    (e.currentTarget.innerHTML = "This month <span>⌄</span>")
                  }
                >
                  This week <ChevronDown size={14} />
                </button>
              </div>
              <div className="activity-chart">
                <div className="y-labels">
                  <span>4h</span>
                  <span>3h</span>
                  <span>2h</span>
                  <span>1h</span>
                  <span>0</span>
                </div>
                <div className="chart-area">
                  <div className="chart-gridlines">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <svg
                    className="chart-svg"
                    viewBox="0 0 600 150"
                    preserveAspectRatio="none"
                    aria-label="Weekly learning activity chart"
                  >
                    <defs>
                      <linearGradient
                        id="chartFill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7774f5"
                          stopOpacity=".2"
                        />
                        <stop
                          offset="100%"
                          stopColor="#7774f5"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 116 C35 110 48 98 85 105 S135 124 170 89 S220 79 255 90 S305 102 340 59 S390 78 425 66 S475 40 510 61 S560 20 600 31 L600 150 L0 150Z"
                      fill="url(#chartFill)"
                    />
                    <path
                      d="M0 116 C35 110 48 98 85 105 S135 124 170 89 S220 79 255 90 S305 102 340 59 S390 78 425 66 S475 40 510 61 S560 20 600 31"
                      fill="none"
                      stroke="#7774f5"
                      strokeWidth="3"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="510"
                      cy="61"
                      r="5"
                      fill="white"
                      stroke="#7774f5"
                      strokeWidth="3"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div className="x-labels">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </article>
            <article className="tip-card">
              <div className="tip-icon">
                <Sparkles size={17} />
              </div>
              <div className="eyebrow">A LITTLE REMINDER</div>
              <h3>Small steps count.</h3>
              <p>
                Even 15 minutes of focused learning today moves you closer to
                your goals.
              </p>
              <div className="tip-footer">
                <span>YOUR DAILY BOOST</span>
                <span>✦ &nbsp;01 / 05</span>
              </div>
            </article>
          </section>
          <footer className="footer">
            <span>© 2026 Learnly</span>
            <span>
              Made for curious minds <span className="footer-heart">♥</span>
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
