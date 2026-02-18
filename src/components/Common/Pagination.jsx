import React from 'react';


const Pagination = ({
  
  currentPage,
  page,
  totalPages = 1,
  onPageChange,
}) => {
  const activePage = currentPage ?? page ?? 1;

  if (!totalPages || totalPages <= 1) return null;

  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);

    if (activePage > 3) pages.push('...');

    const start = Math.max(2, activePage - 1);
    const end = Math.min(totalPages - 1, activePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (activePage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const handleChange = (p) => {
    if (p < 1 || p > totalPages || p === activePage) return;
    onPageChange(p);
  };

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {/* Previous */}
      <button
        onClick={() => handleChange(activePage - 1)}
        disabled={activePage === 1}
        className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        &lt;
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => handleChange(p)}
            className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
              activePage === p
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => handleChange(activePage + 1)}
        disabled={activePage === totalPages}
        className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;