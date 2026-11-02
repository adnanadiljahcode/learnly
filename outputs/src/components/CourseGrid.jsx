import React from "react";
import { Bookmark, Clock3, Play, Plus, BookOpen, Code2, Palette, Megaphone } from "lucide-react";

const formatMinutes = (minutes=0) => { const h=Math.floor(minutes/60), m=minutes%60; return h?`${h}h ${m}m`:`${m}m`; };
export default function CourseGrid({ courses, active, bookmarkedIds, onToggleBookmark, onOpenCourse, onEnroll, searchEmpty=false }) {
  return <div className="course-grid">
    {courses.map(course=>{
      const topic=(course.topic||"").toLowerCase();
      const Icon=topic.includes("design")?Palette:topic.includes("market")?Megaphone:Code2;
      const saved=bookmarkedIds.has(course.id);
      return <article className="course-card" key={course.id}>
        <div className={`course-cover ${topic.includes("design")?"lilac":topic.includes("market")?"peach":"mint"}`}><div className="cover-orb orb-one"/><div className="cover-orb orb-two"/><span className="cover-glyph">{topic.includes("design")?"✳":topic.includes("market")?"◉":"⌘"}</span><div className="cover-type"><Icon size={13}/>{course.topic||"LEARNING"}</div><button className={`save-button ${saved?"is-saved":""}`} aria-label={saved?"Remove bookmark":"Save course"} onClick={()=>onToggleBookmark(course)}><Bookmark size={15} fill={saved?"currentColor":"none"}/></button></div>
        <div className="course-info"><h3>{course.title}</h3><p className="course-description">{course.description||"Build practical skills with this guided course."}</p><div className="course-meta"><span>{course.completed} of {course.lessonTotal} lessons</span><span><Clock3 size={13}/>{formatMinutes(course.estimated_minutes||0)}</span></div><div className="course-progress"><span style={{width:`${course.progress}%`}}/></div><div className="progress-label"><span>{course.enrolled?"Progress":course.level||"Not enrolled"}</span><strong>{course.enrolled?`${course.progress}%`:"Explore"}</strong></div><div className="course-actions">{course.enrolled?<button className="course-action-primary" onClick={()=>onOpenCourse(course)}><Play size={14}/> Open course</button>:<button className="course-action-primary" onClick={()=>onEnroll(course)}><Plus size={14}/> Enroll now</button>}<button className="course-action-secondary" onClick={()=>onOpenCourse(course)}>Details</button></div></div>
      </article>;
    })}
    {!courses.length && <div className="empty-state"><BookOpen size={26}/><h3>{active==="My bookmarks"?"No bookmarks yet":active==="Overview"?"Your learning journey starts here":searchEmpty?"No courses found":"No courses available"}</h3><p>{active==="My bookmarks"?"Save courses with the bookmark icon to find them here.":active==="Overview"?"Explore the course library and enroll in a course to see it on your Overview.":"Try another search, or check back later."}</p>{active!=="My bookmarks"&&<button className="continue-button" onClick={()=>window.dispatchEvent(new CustomEvent("learnly:navigate",{detail:"/explore"}))}>Explore courses</button>}</div>}
  </div>;
}
