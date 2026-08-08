import DashboardLayout from "../../layouts/DashboardLayout";

import {
  Typography,
  Paper,
} from "@mui/material";

import GISMap from "../../components/GIS/GISMap";

function GIS() {

  return (

    <DashboardLayout>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={3}
      >
        GIS Intelligence
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 4,
        }}
      >

        <GISMap />

      </Paper>

    </DashboardLayout>

  );

}

export default GIS;