import { useEffect, useState } from "react";

import {
  Box,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Button,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FolderCopyRoundedIcon from "@mui/icons-material/FolderCopyRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import DashboardLayout from "../../layouts/DashboardLayout";

import StatsCards from "../../components/Project/StatsCards";
import ProjectDialog from "../../components/Project/ProjectDialog";
import DeleteDialog from "../../components/Project/DeleteDialog";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/projectService";

import "./Projects.css";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);

  const [editProject, setEditProject] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (project) => {
    try {
      if (editProject) {
        await updateProject(editProject.id, project);
        alert("Project updated successfully!");
      } else {
        await createProject(project);
        alert("Project created successfully!");
      }

      setOpenDialog(false);
      setEditProject(null);

      loadProjects();
    } catch (error) {
      console.error(error);
      alert("Operation failed.");
    }
  };

  const handleEditClick = (project) => {
    setEditProject(project);
    setOpenDialog(true);
  };

  const handleDeleteClick = (project) => {
    setSelectedProject(project);
    setDeleteOpen(true);
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(selectedProject.id);

      setDeleteOpen(false);
      setSelectedProject(null);

      alert("Project deleted successfully!");

      loadProjects();
    } catch (error) {
      console.error(error);
      alert("Delete failed.");
    }
  };

  const active = projects.filter(
    (p) => p.status?.toLowerCase() === "active"
  ).length;

  const planning = projects.filter(
    (p) => p.status?.toLowerCase() === "planning"
  ).length;

  const completed = projects.filter(
    (p) => p.status?.toLowerCase() === "completed"
  ).length;

  return (
    <DashboardLayout>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <div>
          <Typography variant="h4" fontWeight={700}>
            Project Management
          </Typography>

          <Typography color="text.secondary">
            Manage all renewable energy deployment projects.
          </Typography>
        </div>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setEditProject(null);
            setOpenDialog(true);
          }}
        >
          Add Project
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <StatsCards
            title="Total Projects"
            value={projects.length}
            color="#1565C0"
            icon={<FolderCopyRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatsCards
            title="Active"
            value={active}
            color="#2E7D32"
            icon={<PlayCircleRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatsCards
            title="Planning"
            value={planning}
            color="#FF9800"
            icon={<PendingActionsRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatsCards
            title="Completed"
            value={completed}
            color="#8E24AA"
            icon={<CheckCircleRoundedIcon />}
          />
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
                    {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Paper className="projectCard">

                <Typography variant="h6" fontWeight={700}>
                  {project.project_name}
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    color: "#64748B",
                    minHeight: "55px",
                  }}
                >
                  {project.description}
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    fontWeight: 600,
                  }}
                >
                  📍 {project.location}
                </Typography>

                <Chip
                  sx={{ mt: 3 }}
                  label={project.status}
                  color={
                    project.status === "Active"
                      ? "success"
                      : project.status === "Planning"
                      ? "warning"
                      : "primary"
                  }
                />

                <Box
                  display="flex"
                  gap={1}
                  mt={3}
                >

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityRoundedIcon />}
                    onClick={() =>
                      alert(
                        `Project: ${project.project_name}

Location: ${project.location}

Status: ${project.status}

Description:

${project.description}`
                      )
                    }
                  >
                    View
                  </Button>

                  <Button
                    size="small"
                    color="warning"
                    variant="contained"
                    startIcon={<EditRoundedIcon />}
                    onClick={() =>
                      handleEditClick(project)
                    }
                  >
                    Edit
                  </Button>

                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    startIcon={<DeleteRoundedIcon />}
                    onClick={() =>
                      handleDeleteClick(project)
                    }
                  >
                    Delete
                  </Button>

                </Box>

              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <ProjectDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditProject(null);
        }}
        onSave={handleCreateOrUpdate}
        editProject={editProject}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        content={`Are you sure you want to delete "${selectedProject?.project_name}"?`}
      />

    </DashboardLayout>
  );
}

export default Projects;