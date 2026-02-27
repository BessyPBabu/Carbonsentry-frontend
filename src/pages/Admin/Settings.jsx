import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

/* ── read-only info row used in non-editable sections ── */
function InfoRow({ label, value, valueClass = "text-gray-700" }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

/* ── section wrapper ── */
function SettingsSection({ title, children }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

/* ── static badge used in read-only rows ── */
function StatusBadge({ label = "Enabled" }) {
  return (
    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
      {label}
    </span>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/accounts/organizations/me/");
        setSettings({
          name:          res.data.name          || "",
          industry:      res.data.industry      || "",
          country:       res.data.country       || "",
          primary_email: res.data.primary_email || "",
        });
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/accounts/organizations/me/", {
        name:     settings.name,
        industry: settings.industry,
        country:  settings.country,
      });
      toast.success("Settings updated successfully");
    } catch (err) {
      const msg =
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.detail ||
        "Failed to update settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCompliance = () => {
    const token   = localStorage.getItem("access");
    const baseURL = import.meta.env.VITE_API_BASE_URL || "";
    window.open(`${baseURL}/api/audit_logs/export_csv/?token=${token}`);
  };

  if (loading) return <div className="p-8 text-gray-600">Loading...</div>;
  if (!settings) return null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Organization and system configuration</p>
      </div>

      <div className="max-w-3xl space-y-6">

        {/* ── 1. Organization Settings (editable) ── */}
        <SettingsSection title="Organization Settings">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a8f70]"
                value={settings.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a8f70]"
                value={settings.industry}
                onChange={(e) => handleChange("industry", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Contact Email
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                value={settings.primary_email}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">
                Primary email cannot be changed
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1a8f70] hover:bg-[#157a5f] text-white px-8 py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </SettingsSection>

        {/* ── 2. Security & Access (read-only) ── */}
        <SettingsSection title="Security & Access">
          <InfoRow
            label="Allow User Login"
            value={<StatusBadge label="Enabled" />}
          />
          <InfoRow
            label="Session Timeout"
            value={<StatusBadge label="30 minutes" />}
          />
          <p className="text-xs text-gray-400 mt-3">
            Password policies are enforced system-wide and cannot be modified.
          </p>
        </SettingsSection>

        {/* ── 3. AI & Automation (read-only) ── */}
        <SettingsSection title="AI & Automation">
          <InfoRow
            label="AI Document Validation"
            value={<StatusBadge label="Enabled" />}
          />
          <InfoRow
            label="Auto-Approval Threshold"
            value={
              <span className="text-sm text-gray-600">≈ 55% confidence</span>
            }
          />
          <InfoRow
            label="Human-in-the-Loop Review"
            value={
              <span className="text-sm text-gray-600">Always Enabled</span>
            }
          />
        </SettingsSection>

        {/* ── 4. Notifications (read-only) ── */}
        <SettingsSection title="Notifications">
          <InfoRow
            label="Compliance Alerts"
            value={<StatusBadge label="Enabled" />}
          />
          <InfoRow
            label="Risk Escalation Alerts"
            value={<StatusBadge label="Enabled" />}
          />
          <InfoRow
            label="Report Approval Notifications"
            value={<StatusBadge label="Enabled" />}
          />
        </SettingsSection>

        {/* ── 5. Data & Compliance (read-only + export) ── */}
        <SettingsSection title="Data & Compliance">
          <InfoRow
            label="Data Retention Period"
            value={<StatusBadge label="1 year" />}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleExportCompliance}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
            >
              Export Compliance Data
            </button>
          </div>
        </SettingsSection>

      </div>
    </div>
  );
}