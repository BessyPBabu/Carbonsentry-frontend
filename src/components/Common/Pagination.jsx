// src/components/Common/Pagination.jsx
// ─────────────────────────────────────
// This is the ONLY Pagination file you need.
// All pages already import from components/Common/Pagination — so it lives here.
// No separate UI/Pagination.jsx is required.

import React from "react";

const Pagination = ({ currentPage, page, totalPages = 1, onPageChange }) => {
  const activePage = currentPage ?? page ?? 1;

  if (!totalPages || totalPages <= 1) return null;

  // ── Build page window ──────────────────────────────────────────────────────
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (activePage > 3) pages.push("…");
    const start = Math.max(2, activePage - 1);
    const end   = Math.min(totalPages - 1, activePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (activePage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const handleChange = (p) => {
    if (typeof p !== "number" || p < 1 || p > totalPages || p === activePage) return;
    onPageChange(p);
  };

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      <button
        onClick={() => handleChange(activePage - 1)}
        disabled={activePage === 1}
        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
          text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        &lt;
      </button>

      {pages.map((p, idx) =>
        typeof p === "string" ? (
          <span key={`e-${idx}`} className="px-2 text-gray-400 dark:text-gray-500 select-none">
            {p}
          </span>
        ) : (
          <button
            key={p}
            onClick={() => handleChange(p)}
            className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
              activePage === p
                ? "bg-[#1a8f70] border-[#1a8f70] text-white"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => handleChange(activePage + 1)}
        disabled={activePage === totalPages}
        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
          text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;