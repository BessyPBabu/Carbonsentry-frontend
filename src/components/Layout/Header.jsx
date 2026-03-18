import { Menu } from "lucide-react";

export default function Header({ role, organizationName, onLogout, sidebarOpen, onToggleSidebar }) {
  return (
    <header className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">

      {/* left side: hamburger toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <Menu size={20} />
      </button>

      {/* right side: org + role + logout */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          {organizationName && (
            <p className="text-sm font-medium text-gray-900 leading-none">
              {organizationName}
            </p>
          )}
          <p className="text-xs text-gray-500 capitalize mt-0.5">{role}</p>
        </div>

        <button
          onClick={onLogout}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}