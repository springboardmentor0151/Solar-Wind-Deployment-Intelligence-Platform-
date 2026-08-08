import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";

import { useState, useEffect } from "react";

function ProjectDialog({
  open,
  onClose,
  onSave,
  editProject,
}) {
  const [project, setProject] = useState({
    project_name: "",
    description: "",
    location: "",
    status: "Planning",
  });

  useEffect(() => {
    if (editProject) {
      setProject(editProject);
    } else {
      setProject({
        project_name: "",
        description: "",
        location: "",
        status: "Planning",
      });
    }
  }, [editProject, open]);

  const handleChange = (e) => {
    setProject({
      ...project,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    onSave(project);

    if (!editProject) {
      setProject({
        project_name: "",
        description: "",
        location: "",
        status: "Planning",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {editProject ? "Edit Project" : "Create New Project"}
      </DialogTitle>

      <DialogContent>

        <TextField
          fullWidth
          margin="normal"
          label="Project Name"
          name="project_name"
          value={project.project_name}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Description"
          name="description"
          value={project.description}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Location"
          name="location"
          value={project.location}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          select
          margin="normal"
          label="Status"
          name="status"
          value={project.status}
          onChange={handleChange}
        >
          <MenuItem value="Planning">Planning</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
        </TextField>

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          {editProject ? "Update Project" : "Create Project"}
        </Button>

      </DialogActions>

    </Dialog>
  );
}

export default ProjectDialog;