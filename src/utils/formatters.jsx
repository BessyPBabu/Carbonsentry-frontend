// src/utils/formatters.js

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/** "10:30 AM" — used in CommunicationPage / VendorChatPage */
export const formatTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

/** "Jun 15, 2024" — used as day-separator label in chat */
export const formatDay = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return "—";
  const n = Number(num);
  if (isNaN(n)) return "—";
  return n.toFixed(decimals);
};

export const formatPercentage = (num) => {
  if (num === null || num === undefined) return "—";
  return `${formatNumber(num, 0)}%`;
};

/** Converts raw 0-100 risk score → 0-5 display (divisor=20 matches backend constant) */
export const formatRiskScore = (rawScore, divisor = 20) => {
  if (rawScore === null || rawScore === undefined) return "N/A";
  const n = Number(rawScore);
  if (isNaN(n)) return "N/A";
  return (n / divisor).toFixed(1);
};

/** parseFloat that returns fallback instead of NaN — prevents silent broken comparisons */
export const safeFloat = (value, fallback = 0) => {
  const n = parseFloat(value);
  return isNaN(n) ? fallback : n;
};

export const formatLargeNumber = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "—";
  return n.toLocaleString();
};