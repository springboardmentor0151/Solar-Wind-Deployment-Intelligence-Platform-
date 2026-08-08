import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
} from "@mui/material";

function EnvironmentCard({
  record,
  sites,
  onEdit,
  onDelete,
}) {

  const site = sites.find(
    (s) => s.id === record.site_id
  );

  return (
    <Card
      sx={{
        borderRadius: "18px",
        height: "100%",
      }}
    >
      <CardContent>

        <Typography
          variant="h6"
          fontWeight={700}
        >
          📍 {site ? site.site_name : "Unknown Site"}
        </Typography>

        <Stack spacing={1.2} mt={2}>

          <Typography>
            🌡 Temperature : {record.temperature} °C
          </Typography>

          <Typography>
            💨 Wind Speed : {record.wind_speed} km/h
          </Typography>

          <Typography>
            ☀ Solar Irradiance : {record.solar_irradiance}
          </Typography>

          <Typography>
            💧 Humidity : {record.humidity} %
          </Typography>

          <Typography>
            🌧 Rainfall : {record.rainfall} mm
          </Typography>

          <Typography>
            📈 Air Pressure : {record.air_pressure} hPa
          </Typography>

          <Typography
            color="text.secondary"
          >
            {new Date(record.recorded_at).toLocaleString()}
          </Typography>

        </Stack>

        <Stack
          direction="row"
          spacing={2}
          mt={3}
        >

          <Button
            fullWidth
            variant="outlined"
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>

          <Button
            fullWidth
            color="error"
            variant="contained"
            onClick={() => onDelete(record)}
          >
            Delete
          </Button>

        </Stack>

      </CardContent>
    </Card>
  );
}

export default EnvironmentCard;