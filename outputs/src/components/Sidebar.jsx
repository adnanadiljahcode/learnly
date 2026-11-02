import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Compass, Bookmark, BarChart3, Settings, Flame, Sparkles, LogOut } from "lucide-react";

const links = [
  { to: "/overview", label: "Overview", icon: Home },
  { to: "/explore", label: "Explore courses", icon: Compass },
  { to: "/bookmarks", label: "My bookmarks", icon: Bookmark },
  { to: "/progress", label: "Progress", icon: BarChart3 },
];

export default function Sidebar({ userName, email, bookmarkCount, totalMinutes, onSignOut, open, onNavigate }) {
  const goal = Math.min(100, totalMinutes / 360 * 100);
  return <>
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <NavLink className="brand" to="/overview" onClick={onNavigate}><span className="brand-mark"><Sparkles size={19} fill="currentColor" /></span><span>learnly<span className="brand-dot">.</span></span></NavLink>
      <div className="side-label">WORKSPACE</div>
      <nav className="side-nav">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? "selected" : ""}`}><Icon size={18}/><span>{label}</span>{label === "My bookmarks" && <span className="nav-count">{bookmarkCount}</span>}</NavLink>)}</nav>
      <div className="side-label discover-label">YOUR LEARNING</div>
      <div className="learning-box"><div className="learning-top"><span className="learning-icon"><Flame size={15} fill="currentColor"/></span><span>Weekly goal</span><span className="goal-count">{Math.min(6, Math.round(totalMinutes / 60))}/6h</span></div><div className="goal-track"><span style={{width:`${goal}%`}}/></div><div className="goal-caption">{Math.max(0, 360-totalMinutes)} minutes to reach your 6-hour goal</div></div>
      <div className="sidebar-bottom"><NavLink to="/settings" onClick={onNavigate} className={({isActive})=>`nav-item ${isActive?"selected":""}`}><Settings size={18}/><span>Settings</span></NavLink><div className="side-profile"><div className="avatar avatar-small">{userName.slice(0,1).toUpperCase()}</div><div className="profile-copy"><strong>{userName}</strong><span>{email}</span></div><button className="profile-logout" title="Sign out" onClick={onSignOut}><LogOut size={15}/></button></div></div>
    </aside>
    {open && <button aria-label="Close menu" className="scrim" onClick={onNavigate}/>}
  </>;
}
