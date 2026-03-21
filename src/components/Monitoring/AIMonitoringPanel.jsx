// src/components/Monitoring/AIMonitoringPanel.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";

const POLL_INTERVAL = 30_000; // 30 seconds

// ── Stat tile ──────────────────────────────────────────────────────────────
function MiniStat({ label, value, color = "gray", testId }) {
  const colors = {
    green:  "text-green-600  dark:text-green-400",
    red:    "text-red-600    dark:text-red-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    gray:   "text-gray-700   dark:text-gray-300",
  };
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
      <p
        className={`text-xl font-bold ${colors[color]}`}
        data-testid={testId}
      >
        {value ?? "—"}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ── Metric row ─────────────────────────────────────────────────────────────
function MetricRow({ label, value, testId }) {
  return (
    <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className="font-semibold text-gray-900 dark:text-white"
        data-testid={testId}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── Grafana iframe ─────────────────────────────────────────────────────────
function GrafanaEmbed({ url }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  const embedUrl = (() => {
    try {
      const u = new URL(url);
      if (!u.searchParams.has("kiosk"))   u.searchParams.set("kiosk",   "tv");
      if (!u.searchParams.has("refresh")) u.searchParams.set("refresh", "30s");
      return u.toString();
    } catch {
      return url;
    }
  })();

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border dark:border-gray-600"
      style={{ height: 420 }}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-400 text-sm gap-2">
          <span className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
          Loading Grafana…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-400 text-sm gap-2 p-4 text-center">
          <span className="text-2xl">📡</span>
          <p>Could not load Grafana dashboard.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 hover:underline text-xs mt-1"
          >
            Open in new tab ↗
          </a>
        </div>
      )}
      <iframe
        src={embedUrl}
        title="Grafana AI Monitoring"
        className="w-full h-full border-0"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ display: error ? "none" : "block" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}

// ── DB metrics panel ───────────────────────────────────────────────────────
function DbMetricsPanel({ metrics }) {
  if (!metrics) return null;

  const total =
    (metrics.validations_valid   || 0) +
    (metrics.validations_invalid || 0) +
    (metrics.validations_review  || 0) +
    (metrics.validations_failed  || 0);

  const geminiTotal = (metrics.gemini_success || 0) + (metrics.gemini_failed || 0);
  const geminiPct   = geminiTotal > 0
    ? Math.round((metrics.gemini_success / geminiTotal) * 100)
    : null;

  return (
    <div className="space-y-5">
      {/* Pipeline counts */}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">
          Validation Pipeline
        </p>
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Valid"   value={metrics.validations_valid   ?? "—"} color="green"  testId="stat-valid" />
          <MiniStat label="Invalid" value={metrics.validations_invalid ?? "—"} color="red"    testId="stat-invalid" />
          <MiniStat label="Review"  value={metrics.validations_review  ?? "—"} color="yellow" testId="stat-review" />
          <MiniStat label="Failed"  value={metrics.validations_failed  ?? "—"} color="gray"   testId="stat-failed" />
        </div>

        {/* proportion bar */}
        {total > 0 && (
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
            {[
              { key: "valid",   pct: (metrics.validations_valid   || 0) / total, cls: "bg-green-400" },
              { key: "invalid", pct: (metrics.validations_invalid || 0) / total, cls: "bg-red-400" },
              { key: "review",  pct: (metrics.validations_review  || 0) / total, cls: "bg-yellow-400" },
              { key: "failed",  pct: (metrics.validations_failed  || 0) / total, cls: "bg-gray-400" },
            ].map(({ key, pct, cls }) =>
              pct > 0 ? (
                <div
                  key={key}
                  className={`${cls} h-full transition-all`}
                  style={{ width: `${(pct * 100).toFixed(1)}%` }}
                />
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Confidence + duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Median Confidence</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.median_confidence != null ? `${metrics.median_confidence}%` : "—"}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">P95 Duration</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.p95_duration_s != null ? `${metrics.p95_duration_s}s` : "—"}
          </p>
        </div>
      </div>

      {/* Gemini API success rate */}
      {geminiPct !== null && (
        <div>
          <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Gemini API success rate</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{geminiPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                geminiPct >= 90 ? "bg-green-500" : geminiPct >= 70 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${geminiPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Additional metrics */}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">
          Additional Metrics
        </p>
        <MetricRow
          label="Total validations"
          value={total || "—"}
          testId="metric-total-validations"
        />
        {metrics.avg_processing_time_s != null && (
          <MetricRow label="Avg processing time" value={`${metrics.avg_processing_time_s}s`} />
        )}
        {metrics.auto_approval_rate != null && (
          <MetricRow label="Auto-approval rate" value={`${metrics.auto_approval_rate}%`} />
        )}
        {metrics.manual_review_rate != null && (
          <MetricRow label="Manual review rate" value={`${metrics.manual_review_rate}%`} />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main export
// ══════════════════════════════════════════════════════════════════════════════
export default function AIMonitoringPanel() {
  const [metrics,     setMetrics]     = useState(null);
  const [grafanaUrl,  setGrafanaUrl]  = useState(null);
  const [source,      setSource]      = useState("database");
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showGrafana, setShowGrafana] = useState(false);

  const timerRef = useRef(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/ai-validation/monitoring/");
      setMetrics(res.data.metrics     || null);
      setGrafanaUrl(res.data.grafana_url || null);
      setSource(res.data.source       || "database");
      setLastUpdated(new Date());
    } catch (err) {
      console.error("AIMonitoringPanel.fetchMetrics:", err);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount, then poll every 30 s
  useEffect(() => {
    fetchMetrics();
    timerRef.current = setInterval(fetchMetrics, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchMetrics]);

  const timeSince = lastUpdated
    ? `${Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago`
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            AI System Monitor
          </h3>
          {timeSince && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Updated {timeSince}
              <span className="ml-2 capitalize">· source: {source}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Grafana embed */}
          {grafanaUrl && (
            <button
              onClick={() => setShowGrafana((v) => !v)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                showGrafana
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                  : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {showGrafana ? "Hide Grafana" : "Open Grafana"}
            </button>
          )}

          {/* External Grafana link */}
          {grafanaUrl && (
            <a
              href={grafanaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200
                dark:border-emerald-700 px-2 py-1 rounded hover:bg-emerald-50
                dark:hover:bg-emerald-900/30 transition-colors"
            >
              Grafana ↗
            </a>
          )}

          {/* Refresh button
              FIX: title + aria-label added so tests can locate via
                   screen.getByTitle(/refresh metrics/i)                */}
          <button
            onClick={fetchMetrics}
            disabled={loading}
            title="Refresh metrics"
            aria-label="Refresh metrics"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600
              dark:hover:text-gray-300 w-8 h-8 flex items-center justify-center
              rounded hover:bg-gray-50 dark:hover:bg-gray-700
              disabled:opacity-40 transition-colors"
          >
            {loading ? (
              <span
                className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"
                aria-hidden="true"
              />
            ) : (
              "↻"
            )}
          </button>
        </div>
      </div>

      {/* ── Grafana embed (toggled) ──────────────────────────────────── */}
      {showGrafana && grafanaUrl && (
        <div className="mb-5">
          <GrafanaEmbed url={grafanaUrl} />
        </div>
      )}

      {/* ── Metrics body ─────────────────────────────────────────────── */}
      {loading && !metrics ? (
        // FIX: text "Loading metrics…" is stable and testable.
        // The .animate-spin CSS approach failed because:
        //   (a) jsdom doesn't apply Tailwind classes at runtime, and
        //   (b) the spinner may not be in the DOM during the very first
        //       synchronous render frame.
        <div className="h-44 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm gap-2">
          <span
            className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"
            aria-hidden="true"
          />
          Loading metrics…
        </div>
      ) : metrics ? (
        <DbMetricsPanel metrics={metrics} />
      ) : (
        <div className="h-44 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm gap-2">
          <span className="text-2xl">📡</span>
          <span>Metrics unavailable</span>
          <span className="text-xs text-center max-w-xs">
            Set{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">
              PROMETHEUS_URL
            </code>{" "}
            in your .env to enable live Prometheus data, or ensure the
            monitoring endpoint is reachable.
          </span>
        </div>
      )}
    </div>
  );
}