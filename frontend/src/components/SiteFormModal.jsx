import { useEffect, useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

import { createSite, updateSite } from "../services/siteService";
import { useToast } from "../context/ToastContext";

const emptyForm = {
  siteName: "",
  state: "",
  district: "",
  latitude: "",
  longitude: "",
  elevation: "",
  status: "Active",
};

export default function SiteFormModal({ open, onClose, projectId, site, onSaved }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(site);

  useEffect(() => {
    if (site) {
      setFormData({
        siteName: site.siteName || "",
        state: site.state || "",
        district: site.district || "",
        latitude: site.latitude ?? "",
        longitude: site.longitude ?? "",
        elevation: site.elevation ?? "",
        status: site.status || "Active",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [site, open]);

  if (!open) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.siteName.trim() || !formData.latitude || !formData.longitude) {
      showToast("Please fill in site name, latitude and longitude.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        elevation: formData.elevation === "" ? null : Number(formData.elevation),
        projectId,
      };

      if (isEditing) {
        await updateSite(site.id, payload);
        showToast("Site updated successfully.");
      } else {
        await createSite(payload);
        showToast("Site created successfully.");
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Site" : "Add New Site"}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl"
          >
            <HiOutlineXMark />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-2 text-slate-700">
              Site Name
            </label>
            <input
              type="text"
              name="siteName"
              value={formData.siteName}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2 text-slate-700">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block font-medium mb-2 text-slate-700">
                District
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2 text-slate-700">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block font-medium mb-2 text-slate-700">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2 text-slate-700">
                Elevation (m)
              </label>
              <input
                type="number"
                step="any"
                name="elevation"
                value={formData.elevation}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block font-medium mb-2 text-slate-700">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              >
                <option>Active</option>
                <option>Pending</option>
                <option>Under Review</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-300"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
