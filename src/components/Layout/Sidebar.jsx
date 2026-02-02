import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  AlertTriangle,
  FileText,
  Activity,
  Settings,
} from "lucide-react";

export default function Sidebar({ role, organizationName }) {
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/vendors", label: "Vendors", icon: Building2 },
    ];

    if (role === "admin") {
      return [
        ...baseItems,
        { path: "/risk-analysis", label: "Risk Analysis", icon: AlertTriangle },
        { path: "/reports", label: "Reports", icon: FileText },
        { path: "/audit-logs", label: "Audit Logs", icon: Activity },
        { path: "/user-management", label: "User Management", icon: Users },
        { path: "/settings", label: "Settings", icon: Settings },
      ];
    }

    if (role === "officer") {
      return [
        ...baseItems,
        { path: "/documents", label: "Documents", icon: FileText },
        { path: "/ai-review-queue", label: "AI Review Queue", icon: AlertTriangle },
        { path: "/risk-analysis", label: "Risk Analysis", icon: Activity },
        { path: "/audit-logs", label: "Audit Logs", icon: Activity },
        { path: "/reports", label: "Reports", icon: FileText },
      ];
    }

    // viewer
    return [
      ...baseItems,
      { path: "/risk-analysis", label: "Risk Analysis", icon: AlertTriangle },
      { path: "/reports", label: "Reports", icon: FileText },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-[#1a8f70] text-white flex flex-col min-h-screen">
      {/* LOGO + ORG */}
      <div className="px-6 py-6 border-b border-white/20">
        <h1 className="text-2xl font-bold">CarbonSentry</h1>

        <p className="text-sm text-white/90 mt-1 truncate">
          {organizationName}
        </p>

        <p className="text-xs text-white/70 capitalize">
          {role}
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === `/${role}${item.path}`;

          return (
            <Link
              key={item.path}
              to={`/${role}${item.path}`} 
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                ${
                  active
                    ? "bg-white text-[#1a8f70] font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
