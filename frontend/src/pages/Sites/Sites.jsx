import { useEffect, useState } from "react";

import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";

import DashboardLayout from "../../layouts/DashboardLayout";

import SiteDialog from "../../components/Site/SiteDialog";
import DeleteDialog from "../../components/Project/DeleteDialog";
import StatsCards from "../../components/Project/StatsCards";

import {
  getSites,
  createSite,
  updateSite,
  deleteSite,
} from "../../services/siteService";

import { getProjects } from "../../services/projectService";

function Sites() {

  const [sites, setSites] = useState([]);

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);

  const [editSite, setEditSite] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedSite, setSelectedSite] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    try {

      const siteData = await getSites();

      const projectData = await getProjects();

      setSites(siteData);

      setProjects(projectData);

    } catch (error) {

      console.error(error);

      alert("Failed to load data.");

    } finally {

      setLoading(false);

    }

  };

  const handleSaveSite = async (site) => {

    try {

      if (editSite) {

        await updateSite(editSite.id, site);

        alert("Site Updated Successfully!");

      } else {

        await createSite(site);

        alert("Site Created Successfully!");

      }

      setOpenDialog(false);

      setEditSite(null);

      loadData();

    } catch (error) {

      console.error(error);

      alert("Operation Failed");

    }

  };

  const handleEdit = (site) => {

    setEditSite(site);

    setOpenDialog(true);

  };

  const handleDeleteClick = (site) => {

    setSelectedSite(site);

    setDeleteOpen(true);

  };

  const handleDelete = async () => {

    try {

      await deleteSite(selectedSite.id);

      setDeleteOpen(false);

      setSelectedSite(null);

      loadData();

      alert("Site Deleted Successfully");

    } catch (error) {

      console.error(error);

      alert("Delete Failed");

    }

  };

  return (

    <DashboardLayout>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >

        <div>

          <Typography
            variant="h4"
            fontWeight={700}
          >
            Sites Management
          </Typography>

          <Typography color="text.secondary">

            Manage renewable deployment sites.

          </Typography>

        </div>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {

            setEditSite(null);

            setOpenDialog(true);

          }}
        >

          Add Site

        </Button>

      </Box>

      <Grid
        container
        spacing={3}
        mb={4}
      >

        <Grid item xs={12} md={4}>

          <StatsCards
            title="Total Sites"
            value={sites.length}
            color="#1565C0"
            icon={<PublicRoundedIcon />}
          />

        </Grid>

        <Grid item xs={12} md={4}>

          <StatsCards
            title="Projects"
            value={projects.length}
            color="#2E7D32"
            icon={<LocationOnRoundedIcon />}
          />

        </Grid>

        <Grid item xs={12} md={4}>

          <StatsCards
            title="Mapped Sites"
            value={sites.length}
            color="#FF9800"
            icon={<LocationOnRoundedIcon />}
          />

        </Grid>

      </Grid>

      {loading ? (

        <Box
          display="flex"
          justifyContent="center"
          mt={8}
        >

          <CircularProgress />

        </Box>

      ) : (

        <Grid
          container
          spacing={3}>
                  {sites.map((site) => (

            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={site.id}
            >

              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: "100%",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: 8,
                  },
                }}
              >

                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  📍 {site.site_name}
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    color: "#64748B",
                  }}
                >
                  🌎 Latitude : {site.latitude}
                </Typography>

                <Typography
                  sx={{
                    color: "#64748B",
                  }}
                >
                  🌍 Longitude : {site.longitude}
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    fontWeight: 600,
                  }}
                >
                  📐 Area : {site.area} Acres
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                  }}
                >
                  🏗️ Project :
                  {" "}
                  {site.project
                    ? site.project.project_name
                    : `Project #${site.project_id}`}
                </Typography>

                <Box
                  display="flex"
                  gap={1}
                  mt={3}
                >

                  <Button
                    variant="outlined"
                    startIcon={<EditRoundedIcon />}
                    onClick={() => handleEdit(site)}
                  >
                    Edit
                  </Button>

                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteRoundedIcon />}
                    onClick={() => handleDeleteClick(site)}
                  >
                    Delete
                  </Button>

                </Box>

              </Paper>

            </Grid>

          ))}

        </Grid>

      )}

      <SiteDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditSite(null);
        }}
        onSave={handleSaveSite}
        editSite={editSite}
        projects={projects}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Site"
        content={`Are you sure you want to delete "${selectedSite?.site_name}"?`}
      />

    </DashboardLayout>
  );
}

export default Sites;