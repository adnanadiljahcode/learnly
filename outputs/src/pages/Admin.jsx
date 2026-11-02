import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Users, BookOpen, GraduationCap, Plus, Pencil, Trash2, ShieldCheck, RefreshCw, X, Check, AlertCircle } from "lucide-react";

const emptyCourse={title:"",topic:"General",description:"",level:"Beginner",lessons_count:0,estimated_minutes:0,is_published:false};
const message=e=>e?.message||"Something went wrong. Please try again.";

export default function Admin({userId}){
 const [courses,setCourses]=useState([]),[profiles,setProfiles]=useState([]),[roles,setRoles]=useState([]),[enrollments,setEnrollments]=useState([]);
 const [draft,setDraft]=useState(emptyCourse),[editingId,setEditingId]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(""),[success,setSuccess]=useState(""),[filter,setFilter]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const results=await Promise.all([
  supabase.from("courses").select("id,title,topic,description,level,lessons_count,estimated_minutes,is_published,created_at").order("created_at",{ascending:false}),
  supabase.from("profiles").select("id,full_name,created_at").order("created_at",{ascending:false}),
  supabase.from("user_roles").select("user_id,role"),
  supabase.from("enrollments").select("id,user_id,course_id,completed_at")
 ]);const failed=results.find(x=>x.error);if(failed)throw failed.error;setCourses(results[0].data||[]);setProfiles(results[1].data||[]);setRoles(results[2].data||[]);setEnrollments(results[3].data||[]);}catch(e){setError(message(e));}finally{setLoading(false);}},[]);
 useEffect(()=>{load();},[load]);
 const roleFor=id=>roles.find(x=>x.user_id===id)?.role||"student";
 const reset=()=>{setDraft(emptyCourse);setEditingId(null);};
 async function saveCourse(e){e.preventDefault();setBusy(true);setError("");setSuccess("");try{const payload={title:draft.title.trim(),topic:draft.topic.trim()||"General",description:draft.description.trim(),level:draft.level,lessons_count:Number(draft.lessons_count)||0,estimated_minutes:Number(draft.estimated_minutes)||0,is_published:Boolean(draft.is_published)};const result=editingId?await supabase.from("courses").update(payload).eq("id",editingId):await supabase.from("courses").insert(payload);if(result.error)throw result.error;setSuccess(editingId?"Course updated.":"Course created.");reset();await load();}catch(e){setError(message(e));}finally{setBusy(false);}}
 function editCourse(course){setEditingId(course.id);setDraft({...course});setSuccess("");setError("");window.scrollTo({top:0,behavior:"smooth"});}
 async function deleteCourse(course){if(!window.confirm('Delete "'+course.title+'" and its lessons? This cannot be undone.'))return;setError("");setSuccess("");try{const {error:e}=await supabase.from("courses").delete().eq("id",course.id);if(e)throw e;setSuccess("Course deleted.");await load();}catch(e){setError(message(e));}}
 async function changeRole(profile,role){if(profile.id===userId)return;setError("");setSuccess("");try{const result=role==="student"?await supabase.from("user_roles").delete().eq("user_id",profile.id):await supabase.from("user_roles").upsert({user_id:profile.id,role},{onConflict:"user_id"});if(result.error)throw result.error;setSuccess("User role updated.");await load();}catch(e){setError(message(e));}}
 const filteredProfiles=profiles.filter(p=>(p.full_name||"").toLowerCase().includes(filter.toLowerCase())||p.id.toLowerCase().includes(filter.toLowerCase()));
 return <div className="admin-page">
  <section className="page-intro"><div className="eyebrow">LEARNLY CONTROL CENTER</div><div className="admin-title-row"><div><h1>Administration</h1><p className="welcome-sub">Manage courses, people and platform access.</p></div><button className="secondary-action" onClick={load} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></section>
  {error&&<div className="workspace-alert error-alert"><AlertCircle size={16}/>{error}<button onClick={()=>setError("")}><X size={14}/></button></div>}
  {success&&<div className="workspace-alert success-alert"><Check size={16}/>{success}<button onClick={()=>setSuccess("")}><X size={14}/></button></div>}
  <section className="admin-stats">
   <article><span className="admin-stat-icon"><Users size={18}/></span><strong>{profiles.length}</strong><small>Registered learners</small></article>
   <article><span className="admin-stat-icon"><BookOpen size={18}/></span><strong>{courses.length}</strong><small>Total courses</small></article>
   <article><span className="admin-stat-icon"><GraduationCap size={18}/></span><strong>{enrollments.length}</strong><small>Course enrollments</small></article>
   <article><span className="admin-stat-icon"><ShieldCheck size={18}/></span><strong>{roles.filter(x=>x.role==="admin").length}</strong><small>Administrators</small></article>
  </section>
  <section className="admin-panel">
   <div className="section-heading compact"><div><div className="eyebrow">{editingId?"UPDATE COURSE":"COURSE MANAGEMENT"}</div><h2>{editingId?"Edit course":"Create a course"}</h2></div></div>
   <form className="admin-course-form" onSubmit={saveCourse}>
    <label>Course title<input required maxLength={140} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="e.g. Product Design Fundamentals"/></label>
    <label>Topic<input maxLength={60} value={draft.topic} onChange={e=>setDraft({...draft,topic:e.target.value})} placeholder="Design"/></label>
    <label>Level<select value={draft.level} onChange={e=>setDraft({...draft,level:e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
    <label>Estimated minutes<input type="number" min="0" max="100000" value={draft.estimated_minutes} onChange={e=>setDraft({...draft,estimated_minutes:e.target.value})}/></label>
    <label className="admin-wide">Description<textarea rows="3" maxLength={1200} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="What will learners achieve?"/></label>
    <label>Lesson count<input type="number" min="0" max="10000" value={draft.lessons_count} onChange={e=>setDraft({...draft,lessons_count:e.target.value})}/></label>
    <label className="admin-publish"><input type="checkbox" checked={draft.is_published} onChange={e=>setDraft({...draft,is_published:e.target.checked})}/> Publish course for learners</label>
    <div className="admin-form-actions"><button className="continue-button" type="submit" disabled={busy}>{busy?"Saving…":editingId?"Save changes":<><Plus size={15}/> Create course</>}</button>{editingId&&<button className="secondary-action" type="button" onClick={reset}>Cancel</button>}</div>
   </form>
  </section>
  <section className="admin-panel">
   <div className="section-heading compact"><div><div className="eyebrow">CONTENT LIBRARY</div><h2>Courses <span className="course-count">{courses.length}</span></h2></div></div>
   {loading?<p className="empty-copy">Loading courses…</p>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Course</th><th>Level</th><th>Enrollments</th><th>Status</th><th>Actions</th></tr></thead><tbody>{courses.map(course=><tr key={course.id}><td><strong>{course.title}</strong><small>{course.topic} · {course.lessons_count} lessons</small></td><td>{course.level}</td><td>{enrollments.filter(x=>x.course_id===course.id).length}</td><td><span className={course.is_published?"admin-status published":"admin-status draft"}>{course.is_published?"Published":"Draft"}</span></td><td><div className="admin-row-actions"><button title="Edit course" onClick={()=>editCourse(course)}><Pencil size={15}/></button><button title="Delete course" onClick={()=>deleteCourse(course)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!courses.length&&<p className="empty-copy">No courses yet. Create your first course above.</p>}</div>}
  </section>
  <section className="admin-panel">
   <div className="section-heading compact"><div><div className="eyebrow">PEOPLE & PERMISSIONS</div><h2>Users <span className="course-count">{profiles.length}</span></h2></div><input className="admin-filter" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search users…"/></div>
   <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Learner</th><th>Joined</th><th>Role</th><th>Change access</th></tr></thead><tbody>{filteredProfiles.map(profile=><tr key={profile.id}><td><strong>{profile.full_name||"Unnamed learner"}</strong><small>{profile.id}</small></td><td>{profile.created_at?new Date(profile.created_at).toLocaleDateString():"—"}</td><td><span className="admin-status">{roleFor(profile.id)}</span></td><td><select aria-label={"Role for "+(profile.full_name||profile.id)} value={roleFor(profile.id)} disabled={profile.id===userId} onChange={e=>changeRole(profile,e.target.value)}><option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></td></tr>)}</tbody></table>{!filteredProfiles.length&&<p className="empty-copy">No users match your search.</p>}</div>
  </section>
  <p className="admin-footnote"><ShieldCheck size={14}/> Administrator actions are enforced by Supabase Row Level Security. Never grant an administrator role to an untrusted account.</p>
 </div>;
}
