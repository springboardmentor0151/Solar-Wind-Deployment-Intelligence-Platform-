import { useEffect, useState } from "react";

import {
  Box,
  Grid,
  Typography,
  CircularProgress,
} from "@mui/material";

import DashboardLayout from "../../layouts/DashboardLayout";

import StatsCard from "../../components/Analytics/StatsCard";
import PredictionChart from "../../components/Analytics/PredictionChart";
import TopSiteCard from "../../components/Analytics/TopSiteCard";

import { getSites } from "../../services/siteService";
import { getEnvironmentData } from "../../services/environmentService";

import {
  calculateSolarScore,
  calculateWindScore,
} from "../../utils/predictionEngine";

import PlaceIcon from "@mui/icons-material/Place";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import AirIcon from "@mui/icons-material/Air";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

function Analytics() {

  const [loading, setLoading] = useState(true);

  const [sites, setSites] = useState([]);

  const [averageSolar, setAverageSolar] = useState(0);

  const [averageWind, setAverageWind] = useState(0);

  const [bestSite, setBestSite] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {

    try {

      const siteData = await getSites();

      const envData = await getEnvironmentData();

      setSites(siteData);

      let totalSolar = 0;

      let totalWind = 0;

      let highestScore = 0;

      let topSite = null;

      siteData.forEach((site) => {

        const env = envData.find(
          (e) => e.site_id === site.id
        );

        if (!env) return;

        const solarScore = calculateSolarScore(env);

        const windScore = calculateWindScore(env);

        totalSolar += solarScore;

        totalWind += windScore;

        const combined = (solarScore + windScore) / 2;

        if (combined > highestScore) {

          highestScore = combined;

          topSite = {
            ...site,
            solarScore,
            windScore,
          };

        }

      });

      const validSites = envData.length || 1;

      setAverageSolar(
        Math.round(totalSolar / validSites)
      );

      setAverageWind(
        Math.round(totalWind / validSites)
      );

      setBestSite(topSite);

    } catch (err) {

      console.error(err);

      alert("Failed to load analytics.");

    } finally {

      setLoading(false);

    }

  };

  if (loading) {

    return (

      <DashboardLayout>

        <Box
          display="flex"
          justifyContent="center"
          mt={10}
        >
          <CircularProgress />
        </Box>

      </DashboardLayout>

    );

  }

  return (

    <DashboardLayout>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={4}
      >
        Renewable Resource Analytics
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} md={3}>

          <StatsCard
            title="Total Sites"
            value={sites.length}
            icon={<PlaceIcon />}
            color="#1565C0"
          />

        </Grid>

        <Grid item xs={12} md={3}>

          <StatsCard
            title="Average Solar Score"
            value={`${averageSolar}%`}
            icon={<WbSunnyIcon />}
            color="#F9A825"
          />

        </Grid>

        <Grid item xs={12} md={3}>

          <StatsCard
            title="Average Wind Score"
            value={`${averageWind}%`}
            icon={<AirIcon />}
            color="#00897B"
          />

        </Grid>

        <Grid item xs={12} md={3}>

          <StatsCard
            title="Best Site"
            value={bestSite ? bestSite.site_name : "-"}
            icon={<EmojiEventsIcon />}
            color="#8E24AA"
          />

        </Grid>

      </Grid>

      <Box mt={5}>

        <TopSiteCard site={bestSite} />

      </Box>

      <Box mt={5}>

        <PredictionChart />

      </Box>

    </DashboardLayout>

  );

}

export default Analytics;