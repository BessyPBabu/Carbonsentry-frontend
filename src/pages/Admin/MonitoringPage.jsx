import AIMonitoringPanel from "../../components/Monitoring/AIMonitoringPanel";

export default function MonitoringPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        AI Monitoring
      </h1>
      <AIMonitoringPanel />
    </div>
  );
}
