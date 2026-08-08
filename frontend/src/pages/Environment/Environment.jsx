import { useEffect, useState } from "react";

import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeviceThermostatRoundedIcon from "@mui/icons-material/DeviceThermostatRounded";
import AirRoundedIcon from "@mui/icons-material/Air";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunny";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDrop";

import DashboardLayout from "../../layouts/DashboardLayout";

import EnvironmentDialog from "../../components/Environment/EnvironmentDialog";
import EnvironmentCard from "../../components/Environment/EnvironmentCard";
import EnvironmentStats from "../../components/Environment/EnvironmentStats";
import DeleteDialog from "../../components/Project/DeleteDialog";

import {
  getEnvironmentData,
  createEnvironmentData,
  updateEnvironmentData,
  deleteEnvironmentData,
} from "../../services/environmentService";

import { getSites } from "../../services/siteService";

function Environment() {

  const [records, setRecords] = useState([]);

  const [sites, setSites] = useState([]);

  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);

  const [editRecord, setEditRecord] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    try {

      const env = await getEnvironmentData();

      const siteData = await getSites();

      setRecords(env);

      setSites(siteData);

    } catch (error) {

      console.error(error);

      alert("Failed to load environmental data.");

    } finally {

      setLoading(false);

    }

  };

  const handleSave = async (record) => {

    try {

      if (editRecord) {

        await updateEnvironmentData(editRecord.id, record);

        alert("Environmental Record Updated");

      } else {

        await createEnvironmentData(record);

        alert("Environmental Record Created");

      }

      setOpenDialog(false);

      setEditRecord(null);

      loadData();

    } catch (error) {

      console.error(error);

      alert("Operation Failed");

    }

  };

  const handleEdit = (record) => {

    setEditRecord(record);

    setOpenDialog(true);

  };

  const handleDeleteClick = (record) => {

    setSelectedRecord(record);

    setDeleteOpen(true);

  };

  const handleDelete = async () => {

    try {

      await deleteEnvironmentData(selectedRecord.id);

      setDeleteOpen(false);

      setSelectedRecord(null);

      loadData();

      alert("Deleted Successfully");

    } catch (error) {

      console.error(error);

      alert("Delete Failed");

    }

  };

  const avgTemperature =
    records.length === 0
      ? 0
      : (
          records.reduce(
            (sum, r) => sum + r.temperature,
            0
          ) / records.length
        ).toFixed(1);

  const avgWind =
    records.length === 0
      ? 0
      : (
          records.reduce(
            (sum, r) => sum + r.wind_speed,
            0
          ) / records.length
        ).toFixed(1);

  const avgSolar =
    records.length === 0
      ? 0
      : (
          records.reduce(
            (sum, r) => sum + r.solar_irradiance,
            0
          ) / records.length
        ).toFixed(1);

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

            Environmental Data

          </Typography>

          <Typography color="text.secondary">

            Monitor renewable energy conditions.

          </Typography>

        </div>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {

            setEditRecord(null);

            setOpenDialog(true);

          }}
        >

          Add Record

        </Button>

      </Box>
             <Grid
        container
        spacing={3}
        mb={4}
      >

        <Grid item xs={12} md={3}>
          <EnvironmentStats
            title="Records"
            value={records.length}
            color="#1565C0"
            icon={<WaterDropRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <EnvironmentStats
            title="Avg Temperature"
            value={`${avgTemperature}°C`}
            color="#EF6C00"
            icon={<DeviceThermostatRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <EnvironmentStats
            title="Avg Wind Speed"
            value={`${avgWind} km/h`}
            color="#2E7D32"
            icon={<AirRoundedIcon />}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <EnvironmentStats
            title="Avg Solar"
            value={`${avgSolar}`}
            color="#F9A825"
            icon={<WbSunnyRoundedIcon />}
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
          spacing={3}
        >

          {records.map((record) => (

            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={record.id}
            >

              <EnvironmentCard
                record={record}
                sites={sites}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />

            </Grid>

          ))}

        </Grid>

      )}
            <EnvironmentDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditRecord(null);
        }}
        onSave={handleSave}
        editData={editRecord}
        sites={sites}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Environmental Record"
        message="Are you sure you want to delete this environmental record?"
      />

    </DashboardLayout>
  );
}

export default Environment;
      