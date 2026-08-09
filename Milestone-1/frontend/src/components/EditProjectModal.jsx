import { useEffect, useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

import { updateProject } from "../services/projectService";
import { useToast } from "../context/ToastContext";

export default function EditProjectModal({ open, project, onClose, onSaved }) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    projectName: "",
    energyType: "Solar",
    region: "",
    status: "Active",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.projectName || "",
        energyType: project.energyType || "Solar",
        region: project.region || "",
        status: project.status || "Active",
      });
    }
  }, [project, open]);

  if (!open) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectName.trim() || !formData.region.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      setSaving(true);
      await updateProject(project.id, formData);
      showToast("Project updated successfully.");
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to update project.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Edit Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl"
          >
            <HiOutlineXMark />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-medium mb-2">Project Name</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Energy Type</label>
            <select
              name="energyType"
              value={formData.energyType}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            >
              <option>Solar</option>
              <option>Wind</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">Region</label>
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            >
              <option>Active</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
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
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
