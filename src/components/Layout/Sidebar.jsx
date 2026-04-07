import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  AlertTriangle,
  FileText,
  Activity,
  Settings,
  MessageSquare,
  BookOpen,
  X,
} from "lucide-react";

function getMenuItems(role) {
  const base = [
    { path: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
    { path: "vendors",   label: "Vendors",    icon: Building2 },
  
  ];

  if (role === "admin") {
    return [
      ...base,
      { path: "risk-analysis",   label: "Risk Analysis",   icon: AlertTriangle },
      { path: "reports",         label: "Reports",          icon: FileText },
      { path: "audit-logs",      label: "Audit Logs",       icon: Activity },
      { path: "user-management", label: "User Management",  icon: Users },
      { path: "settings",        label: "Settings",         icon: Settings },
      { path: "carbon-knowledge", label: "Carbon Knowledge",  icon: BookOpen },
    ];
  }

  if (role === "officer") {
    return [
      ...base,
      { path: "documents",       label: "Documents",        icon: FileText },
      { path: "ai-review-queue", label: "AI Review Queue",  icon: AlertTriangle },
      { path: "risk-analysis",   label: "Risk Analysis",    icon: Activity },
      { path: "communication",   label: "Communication",    icon: MessageSquare },
      { path: "audit-logs",      label: "Audit Logs",       icon: Activity },
      { path: "reports",         label: "Reports",          icon: FileText },
      { path: "carbon-knowledge", label: "Carbon Knowledge",  icon: BookOpen },
    ];
  }

  // viewer
  return [
    ...base,
    { path: "risk-analysis", label: "Risk Analysis", icon: AlertTriangle },
    { path: "reports",       label: "Reports",        icon: FileText },
    { path: "carbon-knowledge", label: "Carbon Knowledge",  icon: BookOpen },
  ];
}

export default function Sidebar({ role, organizationName, isOpen, onClose }) {
  const location  = useLocation();
  const menuItems = getMenuItems(role);

  return (
    <>
      {/*
        Mobile: fixed overlay, slides in/out with transform
        Desktop: relative, always in the layout flow
        Width collapses to w-0 when closed on mobile so content doesn't peek
      */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-30
          flex flex-col
          bg-[#1a8f70] text-white
          transition-all duration-200 ease-in-out
          ${isOpen ? "w-64" : "w-0 lg:w-16"}
          overflow-hidden
        `}
      >
        {/* inner wrapper keeps content from distorting during the width transition */}
        <div className="flex flex-col h-full w-64 lg:w-auto">

          {/* header section */}
          <div className={`
            px-4 py-5 border-b border-white/20 flex items-center
            ${isOpen ? "justify-between" : "justify-center lg:justify-center"}
          `}>
            {/* logo + org name — hidden when collapsed on desktop */}
            <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0 lg:max-w-0"}`}>
              <h1 className="text-xl font-bold whitespace-nowrap">CarbonSentry</h1>
              {organizationName && (
                <p className="text-xs text-white/80 mt-0.5 truncate max-w-40">
                  {organizationName}
                </p>
              )}
              <p className="text-xs text-white/60 capitalize">{role}</p>
            </div>

            {/* close button — mobile only */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded hover:bg-white/10 shrink-0"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* nav items */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon   = item.icon;
              const href   = `/${role}/${item.path}`;
              const active = location.pathname === href ||
                             location.pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={item.path}
                  to={href}
                  title={!isOpen ? item.label : undefined}
                  className={`
                    flex items-center gap-3 rounded-lg transition-colors
                    ${isOpen ? "px-4 py-2.5" : "px-2 py-2.5 justify-center lg:justify-center"}
                    ${active
                      ? "bg-white text-[#1a8f70] font-semibold"
                      : "text-white hover:bg-white/10"
                    }
                  `}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className={`
                    text-sm whitespace-nowrap overflow-hidden transition-all duration-200
                    ${isOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0"}
                  `}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* role pill at the bottom when collapsed */}
          {!isOpen && (
            <div className="pb-4 flex justify-center lg:flex">
              <span className="text-xs text-white/50 capitalize">{role?.[0]}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}