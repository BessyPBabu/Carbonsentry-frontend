import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function Header({
  role,
  organizationName,
  onLogout,
  sidebarOpen,
  onToggleSidebar,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700
        px-4 lg:px-6 py-3 flex items-center justify-between shrink-0 transition-colors"
    >
      {/* ── Left: hamburger ─────────────────────────────────────────────── */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400
          hover:text-gray-700 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <Menu size={20} />
      </button>

      {/* ── Right: theme toggle + org info + logout ──────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Dark / Light toggle */}
        {/* <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button> */}

        {/* Org + role label */}
        <div className="text-right hidden sm:block">
          {organizationName && (
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
              {organizationName}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
            {role}
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg
            text-sm text-gray-600 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}