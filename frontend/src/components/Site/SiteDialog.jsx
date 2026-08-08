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

function SiteDialog({
  open,
  onClose,
  onSave,
  editSite,
  projects,
}) {
  const [site, setSite] = useState({
    site_name: "",
    latitude: "",
    longitude: "",
    area: "",
    project_id: "",
  });

  useEffect(() => {
    if (editSite) {
      setSite(editSite);
    } else {
      setSite({
        site_name: "",
        latitude: "",
        longitude: "",
        area: "",
        project_id: "",
      });
    }
  }, [editSite, open]);

  const handleChange = (e) => {
    setSite({
      ...site,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    onSave({
      ...site,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      area: Number(site.area),
      project_id: Number(site.project_id),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">

      <DialogTitle>
        {editSite ? "Edit Site" : "Add Site"}
      </DialogTitle>

      <DialogContent>

        <TextField
          fullWidth
          margin="normal"
          label="Site Name"
          name="site_name"
          value={site.site_name}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Latitude"
          name="latitude"
          value={site.latitude}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Longitude"
          name="longitude"
          value={site.longitude}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Area (Acres)"
          name="area"
          value={site.area}
          onChange={handleChange}
        />

        <TextField
          select
          fullWidth
          margin="normal"
          label="Project"
          name="project_id"
          value={site.project_id}
          onChange={handleChange}
        >
          {projects.map((project) => (
            <MenuItem
              key={project.id}
              value={project.id}
            >
              {project.project_name}
            </MenuItem>
          ))}
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
          {editSite ? "Update Site" : "Create Site"}
        </Button>

      </DialogActions>

    </Dialog>
  );
}

export default SiteDialog;