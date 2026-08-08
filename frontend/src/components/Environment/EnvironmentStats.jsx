import { Card, CardContent, Typography, Box } from "@mui/material";

function EnvironmentStats({ title, value, color, icon }) {
  return (
    <Card
      sx={{
        borderRadius: "18px",
        boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-5px)",
        },
      }}
    >
      <CardContent>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >

          <Box>

            <Typography
              color="text.secondary"
              fontSize={15}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
              mt={1}
            >
              {value}
            </Typography>

          </Box>

          <Box
            sx={{
              width: 55,
              height: 55,
              borderRadius: "50%",
              background: color,
              color: "#fff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {icon}
          </Box>

        </Box>

      </CardContent>
    </Card>
  );
}

export default EnvironmentStats;