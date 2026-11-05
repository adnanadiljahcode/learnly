import React from "react";
import { Search, Bell, Menu, X } from "lucide-react";
export default function Header({
  title,
  search,
  onSearch,
  noticeOpen,
  onToggleNotice,
  notices,
  menuOpen,
  onToggleMenu,
  userName,
  onNavigate,
}) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu icon-button"
        onClick={onToggleMenu}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="breadcrumb">
        <a
          href="/overview"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/overview");
          }}
        >
          My workspace
        </a>
        <span>/</span>
        <strong>{title}</strong>
      </div>
      <div className="top-actions">
        <label className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={onSearch}
            placeholder="Search courses..."
          />
          <kbd>⌕</kbd>
        </label>
        <div className="notice-wrap">
          <button
            className="icon-button notification-button"
            aria-label="Notifications"
            onClick={onToggleNotice}
          >
            <Bell size={18} />
            <span className="notification-dot" />
          </button>
          {noticeOpen && (
            <div className="notice-popover">
              <div className="notice-heading">
                Notifications <button onClick={onToggleNotice}>Close</button>
              </div>
              {notices.map((notice, i) => (
                <div className="notice-row" key={i}>
                  <span className="notice-bullet" />
                  <span>{notice}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="avatar">{userName.slice(0, 1).toUpperCase()}</div>
      </div>
    </header>
  );
}
