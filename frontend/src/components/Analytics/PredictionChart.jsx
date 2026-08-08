import {
  Paper,
  Typography,
} from "@mui/material";

function PredictionChart() {

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        borderRadius: 3,
        textAlign: "center",
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
      >
        📊 Prediction Chart
      </Typography>

      <Typography
        mt={3}
        color="text.secondary"
      >
        Solar & Wind score visualization
        will be added here.
      </Typography>

    </Paper>
  );
}

export default PredictionChart;