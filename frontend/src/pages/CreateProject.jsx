import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../services/projectService";
import { useAuth } from "../Authentication/AuthContext";
import { useToast } from "../context/ToastContext";

import DashboardLayout from "../components/layout/DashboardLayout";

export default function CreateProject() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    projectName: "",
    energyType: "Solar",
    region: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectName.trim() || !formData.region.trim()) {
      showToast("Please fill in the project name and region.", "error");
      return;
    }

    try {
      setLoading(true);

      await createProject({
        ...formData,
        createdBy: currentUser.email,
      });

      showToast("Project created successfully!");
      navigate("/projects");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to create project.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-full flex justify-center items-center p-6 py-16">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Create New Project
          </h1>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
