import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/accounts/organizations/me/");
        setSettings({
          name: res.data.name,
          industry: res.data.industry,
          country: res.data.country,
          primary_email: res.data.primary_email,
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
        name: settings.name,
        industry: settings.industry,
        country: settings.country,
      });
      toast.success("Settings updated successfully");
    } catch (err) {
      const errorMsg = err?.response?.data?.name?.[0] 
        || err?.response?.data?.detail 
        || "Failed to update settings";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!settings) return null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization profile</p>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              value={settings.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              value={settings.industry}
              onChange={(e) => handleChange("industry", e.target.value)}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              value={settings.country}
              onChange={(e) => handleChange("country", e.target.value)}
            />
          </div>

          {/* Primary Email - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Email
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              value={settings.primary_email}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              Primary email cannot be changed
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}