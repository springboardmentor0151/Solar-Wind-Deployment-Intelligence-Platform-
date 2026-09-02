import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

function Projects() {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Load all projects
  const loadProjects = async () => {
    try {
      const response = await API.get("/projects/");
      setProjects(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Save Project
  const saveProject = async () => {
    try {
      await API.post("/projects/", {
        project_name: projectName,
        description: description,
      });

      alert("Project Created Successfully");

      setProjectName("");
      setDescription("");

      loadProjects();
    } catch (error) {
      alert("Error Creating Project");
    }
  };

  // Edit Project
  const editProject = (project) => {
    setProjectName(project.project_name);
    setDescription(project.description);
    setEditingId(project.id);
  };

  // Update Project
  const updateProject = async () => {
    try {
      await API.put(`/projects/${editingId}`, {
        project_name: projectName,
        description: description,
      });

      alert("Project Updated Successfully");

      setProjectName("");
      setDescription("");
      setEditingId(null);

      loadProjects();
    } catch (error) {
      alert("Error Updating Project");
    }
  };

  // Delete Project
  const deleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await API.delete(`/projects/${id}`);

      alert("Project Deleted Successfully");

      loadProjects();
    } catch (error) {
      alert("Error Deleting Project");
    }
  };

  return (
    <Layout>
      <h1>📁 Project Management</h1>

      <h2>{editingId ? "Edit Project" : "Add New Project"}</h2>

      <input
        type="text"
        placeholder="Project Name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        style={{
          width: "350px",
          padding: "10px",
          marginBottom: "10px",
          display: "block",
        }}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{
          width: "350px",
          height: "80px",
          padding: "10px",
          marginBottom: "15px",
          display: "block",
        }}
      />

      <button
        onClick={editingId ? updateProject : saveProject}
        style={{
          padding: "10px 20px",
          background: editingId ? "#f59e0b" : "#16a34a",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "30px",
        }}
      >
        {editingId ? "Update Project" : "Save Project"}
      </button>

      <hr />

      <h2>All Projects</h2>

      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              background: "white",
            }}
          >
            <h3>{project.project_name}</h3>

            <p>{project.description}</p>

            <p>
              <strong>ID:</strong> {project.id}
            </p>

            <button
              onClick={() => editProject(project)}
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "5px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              ✏ Edit
            </button>

            <button
              onClick={() => deleteProject(project.id)}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              🗑 Delete
            </button>
          </div>
        ))
      )}
    </Layout>
  );
}

export default Projects;