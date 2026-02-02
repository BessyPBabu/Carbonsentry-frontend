import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/accounts/organizations/me/");
        setSettings({
          orgName: res.data.name,
          industry: res.data.industry,
          primaryEmail: res.data.primary_email,
          allowUserLogin: res.data.allow_user_login,
          complianceAlerts: res.data.compliance_alerts,
          riskEscalationAlerts: res.data.risk_escalation_alerts,
          reportApprovalNotifications:
            res.data.report_approval_notifications,
        });
      } catch {
        toast.error("Failed to load settings");
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
        name: settings.orgName,
        industry: settings.industry,
        primary_email: settings.primaryEmail,
        allow_user_login: settings.allowUserLogin,
        compliance_alerts: settings.complianceAlerts,
        risk_escalation_alerts: settings.riskEscalationAlerts,
        report_approval_notifications:
          settings.reportApprovalNotifications,
      });
      toast.success("Settings updated successfully");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="max-w-3xl space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            value={settings.orgName}
            onChange={(e) => handleChange("orgName", e.target.value)}
          />

          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            value={settings.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
          />

          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            value={settings.primaryEmail}
            onChange={(e) =>
              handleChange("primaryEmail", e.target.value)
            }
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
