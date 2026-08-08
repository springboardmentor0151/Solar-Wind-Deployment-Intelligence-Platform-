import { Box, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";

function StatsCards({ title, value, color, icon }) {
  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.03,
      }}
      transition={{
        duration: 0.25,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "22px",
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,.4)",
          boxShadow: "0 10px 35px rgba(0,0,0,.08)",
          height: 170,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            width: 55,
            height: 55,
            borderRadius: "16px",
            background: color,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff",
          }}
        >
          {icon}
        </Box>

        <div>
          <Typography
            sx={{
              color: "#64748B",
              fontWeight: 600,
              mb: 1,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#0F172A",
            }}
          >
            {value}
          </Typography>
        </div>
      </Paper>
    </motion.div>
  );
}

export default StatsCards;