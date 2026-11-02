import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Sparkles, LoaderCircle, AlertCircle, CheckCircle2, X, Circle, Check } from "lucide-react";
import { Auth } from "./Auth";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Overview from "./pages/Overview";
import ExploreCourses from "./pages/ExploreCourses";
import Bookmarks from "./pages/Bookmarks";
import Progress from "./pages/Progress";
import SettingsPage from "./pages/Settings";
import "./style.css";

const routeTitles={"/overview":"Overview","/explore":"Explore courses","/bookmarks":"My bookmarks","/progress":"Progress","/settings":"Settings"};
const formatMinutes=(n=0)=>{const h=Math.floor(n/60),r=n%60;return h?`${h}h ${r}m`:`${r}m`;};
const errorMessage=e=>e?.message||"Something went wrong. Please try again.";

function SetupRequired(){return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span className="auth-brand-mark"><Sparkles size={18}/></span><span>learnly<span className="auth-brand-dot">.</span></span></div><div className="auth-heading"><p className="auth-eyebrow">BACKEND SETUP REQUIRED</p><h1>Connect your Supabase project</h1><p>Add your project credentials to <code>outputs/.env.local</code>, then restart Vite.</p></div><pre className="setup-code">VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co{"\n"}VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY</pre><p className="auth-switch">Then run <code>npm run dev -- --host 0.0.0.0</code>.</p></section></main>;}

function App(){
 const [path,setPath]=useState(()=>routeTitles[window.location.pathname]?window.location.pathname:"/overview");
 const [session,setSession]=useState(null),[authReady,setAuthReady]=useState(false);
 const [search,setSearch]=useState(""),[noticeOpen,setNoticeOpen]=useState(false),[menuOpen,setMenuOpen]=useState(false);
 const [profile,setProfile]=useState(null),[courses,setCourses]=useState([]),[enrollments,setEnrollments]=useState([]),[bookmarks,setBookmarks]=useState([]),[lessons,setLessons]=useState([]),[completedLessonIds,setCompletedLessonIds]=useState([]),[activity,setActivity]=useState([]);
 const [loading,setLoading]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 const [selectedCourse,setSelectedCourse]=useState(null),[courseLessons,setCourseLessons]=useState([]),[lessonBusy,setLessonBusy]=useState(false),[settingsName,setSettingsName]=useState(""),[savingProfile,setSavingProfile]=useState(false);

 const navigate=useCallback((to)=>{const next=routeTitles[to]?to:"/overview";if(window.location.pathname!==next)window.history.pushState({}, "", next);setPath(next);setSearch("");setMenuOpen(false);setNoticeOpen(false);},[]);
 useEffect(()=>{const onPop=()=>{setPath(routeTitles[window.location.pathname]?window.location.pathname:"/overview");setSearch("");};window.addEventListener("popstate",onPop);if(!routeTitles[window.location.pathname])window.history.replaceState({}, "", "/overview");return()=>window.removeEventListener("popstate",onPop);},[]);

 useEffect(()=>{if(!isSupabaseConfigured)return;let mounted=true;supabase.auth.getSession().then(({data,error:e})=>{if(!mounted)return;if(e)setError(errorMessage(e));setSession(data?.session||null);setAuthReady(true);});const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setAuthReady(true);});return()=>{mounted=false;listener.subscription.unsubscribe();};},[]);

 const loadWorkspace=useCallback(async()=>{if(!session?.user)return;setLoading(true);setError("");const uid=session.user.id;try{const results=await Promise.all([
  supabase.from("profiles").select("id,full_name").eq("id",uid).maybeSingle(),
  supabase.from("courses").select("id,title,topic,description,lessons_count,estimated_minutes,level").eq("is_published",true).order("created_at",{ascending:true}),
  supabase.from("enrollments").select("id,course_id,enrolled_at,completed_at").eq("user_id",uid),
  supabase.from("bookmarks").select("id,course_id").eq("user_id",uid),
  supabase.from("lessons").select("id,course_id,title,position,duration_minutes").order("position"),
  supabase.from("lesson_progress").select("lesson_id,completed_at").eq("user_id",uid),
  supabase.from("learning_activity").select("activity_date,minutes").eq("user_id",uid).gte("activity_date",new Date(Date.now()-6*86400000).toISOString().slice(0,10)).order("activity_date")
 ]);const failed=results.find(r=>r.error);if(failed)throw failed.error;const [p,c,e,b,l,pr,a]=results;setProfile(p.data);setSettingsName(p.data?.full_name||session.user.user_metadata?.full_name||"");setCourses(c.data||[]);setEnrollments(e.data||[]);setBookmarks(b.data||[]);setLessons(l.data||[]);setCompletedLessonIds((pr.data||[]).map(x=>x.lesson_id));setActivity(a.data||[]);}catch(e){setError(errorMessage(e));}finally{setLoading(false);}},[session]);
 useEffect(()=>{if(session?.user)loadWorkspace();},[session?.user?.id,loadWorkspace]);

 const bookmarkedIds=useMemo(()=>new Set(bookmarks.map(x=>x.course_id)),[bookmarks]);
 const coursesWithProgress=useMemo(()=>courses.map(course=>{const ls=lessons.filter(x=>x.course_id===course.id),completed=ls.filter(x=>completedLessonIds.includes(x.id)).length,enrollment=enrollments.find(x=>x.course_id===course.id);return {...course,enrolled:Boolean(enrollment),enrollment,lessonTotal:ls.length||course.lessons_count||0,completed,progress:ls.length?Math.round(completed/ls.length*100):0};}),[courses,lessons,completedLessonIds,enrollments]);
 const myCourses=coursesWithProgress.filter(c=>c.enrolled),savedCourses=coursesWithProgress.filter(c=>bookmarkedIds.has(c.id));
 const filteredCourses=coursesWithProgress.filter(c=>`${c.title} ${c.topic||""} ${c.description||""}`.toLowerCase().includes(search.toLowerCase()));
 const totalMinutes=activity.reduce((sum,x)=>sum+Number(x.minutes||0),0),completedCourses=myCourses.filter(c=>c.lessonTotal>0&&c.progress===100).length,currentCourse=myCourses.find(c=>c.progress<100)||myCourses[0];
 const userName=profile?.full_name||session?.user?.user_metadata?.full_name||session?.user?.email?.split("@")[0]||"Learner";
 const activityByDay=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=d.toISOString().slice(0,10),item=activity.find(x=>x.activity_date===key);return {label:d.toLocaleDateString(undefined,{weekday:"short"}),minutes:Number(item?.minutes||0)};});
 const maxActivity=Math.max(60,...activityByDay.map(x=>x.minutes));
 const notices=[currentCourse?`Continue ${currentCourse.title} whenever you're ready.`:"Explore courses and enroll to start learning.",totalMinutes<120?"A short study session today will help build your weekly habit.":"Great work keeping your learning activity up."];

 async function toggleBookmark(course){setError("");setSuccess("");const existing=bookmarks.find(x=>x.course_id===course.id);try{if(existing){const {error:e}=await supabase.from("bookmarks").delete().eq("id",existing.id).eq("user_id",session.user.id);if(e)throw e;setBookmarks(items=>items.filter(x=>x.id!==existing.id));}else{const {data,error:e}=await supabase.from("bookmarks").insert({user_id:session.user.id,course_id:course.id}).select("id,course_id").single();if(e)throw e;setBookmarks(items=>[...items,data]);}}catch(e){setError(errorMessage(e));}}
 async function enroll(course){setError("");setSuccess("");try{const {data,error:e}=await supabase.from("enrollments").insert({user_id:session.user.id,course_id:course.id}).select("id,course_id,enrolled_at,completed_at").single();if(e)throw e;setEnrollments(items=>[...items,data]);setSuccess(`You're enrolled in ${course.title}.`);navigate("/overview");}catch(e){setError(errorMessage(e));}}
 async function openCourse(course){setSelectedCourse(course);setCourseLessons([]);setError("");const {data,error:e}=await supabase.from("lessons").select("id,course_id,title,position,duration_minutes,content").eq("course_id",course.id).order("position");if(e)setError(errorMessage(e));else setCourseLessons(data||[]);}
 async function completeLesson(lesson){setLessonBusy(true);setError("");setSuccess("");try{const {error:e}=await supabase.from("lesson_progress").upsert({user_id:session.user.id,lesson_id:lesson.id,completed_at:new Date().toISOString()},{onConflict:"user_id,lesson_id"});if(e)throw e;const today=new Date().toISOString().slice(0,10),{data:existing,error:readError}=await supabase.from("learning_activity").select("id,minutes").eq("user_id",session.user.id).eq("activity_date",today).maybeSingle();if(readError)throw readError;const mins=Math.max(1,Number(lesson.duration_minutes||15));const write=existing?await supabase.from("learning_activity").update({minutes:Number(existing.minutes||0)+mins}).eq("id",existing.id):await supabase.from("learning_activity").insert({user_id:session.user.id,activity_date:today,minutes:mins});if(write.error)throw write.error;setCompletedLessonIds(ids=>ids.includes(lesson.id)?ids:[...ids,lesson.id]);setSuccess("Lesson marked complete. Your progress has been updated.");await loadWorkspace();}catch(e){setError(errorMessage(e));}finally{setLessonBusy(false);}}
 async function saveProfile(event){event.preventDefault();setSavingProfile(true);setError("");setSuccess("");try{const {error:e}=await supabase.from("profiles").upsert({id:session.user.id,full_name:settingsName.trim()},{onConflict:"id"});if(e)throw e;const {error:authError}=await supabase.auth.updateUser({data:{full_name:settingsName.trim()}});if(authError)throw authError;setProfile({id:session.user.id,full_name:settingsName.trim()});setSuccess("Your profile has been saved.");}catch(e){setError(errorMessage(e));}finally{setSavingProfile(false);}}
 async function signOut(){await supabase.auth.signOut();navigate("/overview");}

 if(!isSupabaseConfigured)return <SetupRequired/>;
 if(!authReady)return <main className="auth-page"><div className="loading-state"><LoaderCircle className="spin"/> Connecting to Learnly…</div></main>;
 if(!session)return <Auth onSignedIn={()=>{}}/>;

 const shared={bookmarkedIds,onToggleBookmark:toggleBookmark,onOpenCourse:openCourse,onEnroll:enroll,onNavigate:navigate};
 const page=path==="/explore"?<ExploreCourses courses={filteredCourses} {...shared}/>:path==="/bookmarks"?<Bookmarks courses={savedCourses} {...shared}/>:path==="/progress"?<Progress myCourses={myCourses} completedCourses={completedCourses} totalMinutes={totalMinutes} activityByDay={activityByDay} maxActivity={maxActivity}/>:path==="/settings"?<SettingsPage settingsName={settingsName} onNameChange={setSettingsName} email={session.user.email} onSave={saveProfile} savingProfile={savingProfile} onSignOut={signOut}/>:<Overview userName={userName} myCourses={myCourses} currentCourse={currentCourse} totalMinutes={totalMinutes} completedCourses={completedCourses} activityByDay={activityByDay} maxActivity={maxActivity} {...shared}/>;

 return <div className="app-shell">
  <Sidebar path={path} userName={userName} email={session.user.email} bookmarkCount={bookmarks.length} totalMinutes={totalMinutes} onSignOut={signOut} open={menuOpen} onNavigate={navigate}/>
  <main className="main-area"><Header title={routeTitles[path]} search={search} onSearch={e=>setSearch(e.target.value)} noticeOpen={noticeOpen} onToggleNotice={()=>setNoticeOpen(v=>!v)} notices={notices} menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(v=>!v)} userName={userName} onNavigate={navigate}/>
   <div className="content">{error&&<div className="workspace-alert error-alert" role="alert"><AlertCircle size={16}/>{error}<button onClick={()=>setError("")}><X size={15}/></button></div>}{success&&<div className="workspace-alert success-alert" role="status"><CheckCircle2 size={16}/>{success}<button onClick={()=>setSuccess("")}><X size={15}/></button></div>}{loading&&<div className="loading-banner"><LoaderCircle className="spin" size={16}/> Syncing your learning workspace…</div>}{page}<footer className="footer"><span>© {new Date().getFullYear()} Learnly</span><span>Made for curious minds <span className="footer-heart">♥</span></span></footer></div>
  </main>
  {selectedCourse&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedCourse(null);}}><section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title"><div className="modal-heading"><div><div className="eyebrow">COURSE DETAILS</div><h2 id="course-modal-title">{selectedCourse.title}</h2></div><button className="icon-button" onClick={()=>setSelectedCourse(null)} aria-label="Close course"><X size={19}/></button></div><p>{selectedCourse.description||"Follow the lessons below and track your learning progress."}</p>{!selectedCourse.enrolled&&<button className="continue-button" onClick={()=>enroll(selectedCourse)}>Enroll in course</button>}<div className="lesson-list">{courseLessons.map(lesson=>{const done=completedLessonIds.includes(lesson.id);return <article className="lesson-row" key={lesson.id}><div className="lesson-status">{done?<CheckCircle2 size={19}/>:<Circle size={19}/>}</div><div className="lesson-copy"><strong>{lesson.position}. {lesson.title}</strong><span>{formatMinutes(lesson.duration_minutes||0)}</span>{lesson.content&&<p>{lesson.content}</p>}</div>{selectedCourse.enrolled&&<button disabled={done||lessonBusy} className="lesson-complete" onClick={()=>completeLesson(lesson)}>{done?"Completed":lessonBusy?"Saving…":"Mark complete"}</button>}</article>;})}{courseLessons.length===0&&<p className="empty-copy">No lessons have been added to this course yet.</p>}</div></section></div>}
 </div>;
}
createRoot(document.getElementById("root")).render(<App/>);
