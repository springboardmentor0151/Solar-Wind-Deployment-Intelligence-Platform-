import {
  Card,
  CardContent,
  Typography,
  Chip,
} from "@mui/material";

function TopSiteCard({ site }) {

  if (!site) {
    return null;
  }

  return (
    <Card
      elevation={3}
      sx={{ borderRadius: 3 }}
    >
      <CardContent>

        <Typography
          variant="h5"
          fontWeight={700}
        >
          🏆 Best Renewable Site
        </Typography>

        <Typography mt={2}>
          <strong>Name:</strong> {site.site_name}
        </Typography>

        <Typography>
          <strong>Solar Score:</strong> {site.solarScore}%
        </Typography>

        <Typography>
          <strong>Wind Score:</strong> {site.windScore}%
        </Typography>

        <Chip
          label="Highly Recommended"
          color="success"
          sx={{ mt: 2 }}
        />

      </CardContent>
    </Card>
  );
}

export default TopSiteCard;