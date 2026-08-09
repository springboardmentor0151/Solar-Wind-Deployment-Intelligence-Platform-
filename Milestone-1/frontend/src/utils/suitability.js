/**
 * Simple, rule-based renewable energy suitability scoring.
 *
 * This is intentionally NOT machine learning — it's a transparent point
 * system so the reasons behind a rating are easy to explain to a mentor
 * or reviewer. Milestone 2 ("AI Site Suitability Prediction") is where a
 * learned model would replace this.
 *
 * Factors used (per the Milestone 1 spec):
 *   Solar: solar irradiance, elevation/terrain, nearby roads, nearby power infra
 *   Wind:  wind speed,       elevation/terrain, nearby roads, nearby power infra
 *
 * Wind resource data source note: Global Wind Atlas has no practical,
 * documented public API for direct server-side integration (it's a
 * map-tile/visual product, not a REST data API). NASA POWER's WS10M
 * (10-meter wind speed) is used here as the Milestone 1 wind data source.
 * Global Wind Atlas remains a good MANUAL cross-validation source and is
 * a candidate for a later milestone if a suitable data export/API is found.
 */

const LEVELS = {
  HIGH: "High Potential",
  MODERATE: "Moderate Potential",
  LOW: "Low Potential",
  UNKNOWN: "Insufficient Data",
};

function scoreElevation(elevation) {
  // Lower elevation generally means simpler construction/access logistics
  // for both panel and turbine installations. This is a simplified
  // accessibility proxy, not a meteorological siting model.
  if (elevation === null || elevation === undefined) {
    return { points: null, reason: null };
  }
  if (elevation <= 1500) {
    return {
      points: 2,
      reason: `Elevation of ${elevation}m is favorable for straightforward construction and access.`,
    };
  }
  if (elevation <= 3000) {
    return {
      points: 1,
      reason: `Elevation of ${elevation}m is workable but may add some construction/access cost.`,
    };
  }
  return {
    points: 0,
    reason: `Elevation of ${elevation}m is quite high, which can increase construction and maintenance difficulty.`,
  };
}

function scoreRoads(nearbyRoads, roadCount) {
  if (nearbyRoads === null || nearbyRoads === undefined) {
    return { points: null, reason: null };
  }
  if (nearbyRoads) {
    return {
      points: 1,
      reason: `${roadCount ?? "Nearby"} road segment(s) found nearby, supporting easier construction access.`,
    };
  }
  return {
    points: 0,
    reason: "No nearby roads detected — site access may require additional infrastructure.",
  };
}

function scorePowerInfrastructure(nearbyPower, powerCount) {
  if (nearbyPower === null || nearbyPower === undefined) {
    return { points: null, reason: null };
  }
  if (nearbyPower) {
    return {
      points: 1,
      reason: `${powerCount ?? "Nearby"} power infrastructure feature(s) found, which can simplify grid connection.`,
    };
  }
  return {
    points: 0,
    reason: "No nearby power infrastructure detected — grid connection may require additional investment.",
  };
}

function scoreSolarIrradiance(solarIrradiance) {
  if (solarIrradiance === null || solarIrradiance === undefined) {
    return { points: null, reason: null };
  }
  if (solarIrradiance >= 5.5) {
    return {
      points: 2,
      reason: `Solar irradiance of ${solarIrradiance} kWh/m²/day is strong for solar generation.`,
    };
  }
  if (solarIrradiance >= 4.5) {
    return {
      points: 1,
      reason: `Solar irradiance of ${solarIrradiance} kWh/m²/day is moderate for solar generation.`,
    };
  }
  return {
    points: 0,
    reason: `Solar irradiance of ${solarIrradiance} kWh/m²/day is on the lower side for solar generation.`,
  };
}

function scoreWindSpeed(windSpeed) {
  if (windSpeed === null || windSpeed === undefined) {
    return { points: null, reason: null };
  }
  if (windSpeed >= 5) {
    return {
      points: 2,
      reason: `Average wind speed of ${windSpeed} m/s is strong for wind energy generation.`,
    };
  }
  if (windSpeed >= 3.5) {
    return {
      points: 1,
      reason: `Average wind speed of ${windSpeed} m/s is moderate for wind energy generation.`,
    };
  }
  return {
    points: 0,
    reason: `Average wind speed of ${windSpeed} m/s is on the lower side for wind energy generation.`,
  };
}

function levelFromScore(score, maxScore) {
  if (maxScore === 0) return LEVELS.UNKNOWN;
  const ratio = score / maxScore;
  if (ratio >= 0.7) return LEVELS.HIGH;
  if (ratio >= 0.4) return LEVELS.MODERATE;
  return LEVELS.LOW;
}

/**
 * @param {"Solar"|"Wind"|string} energyType
 * @param {Object} environmentalData - { solarIrradiance, temperature, windSpeed }
 * @param {Object} terrainData - { elevation }
 * @param {Object} gisData - { nearbyRoads, roadCount, nearbyPowerInfrastructure, powerInfrastructureCount }
 * @returns {{ level: string, score: number, maxScore: number, reasons: string[] }}
 */
export function computeSuitability(energyType, environmentalData = {}, terrainData = {}, gisData = {}) {
  const elevationScore = scoreElevation(terrainData.elevation);
  const roadsScore = scoreRoads(gisData.nearbyRoads, gisData.roadCount);
  const powerScore = scorePowerInfrastructure(
    gisData.nearbyPowerInfrastructure,
    gisData.powerInfrastructureCount
  );

  const primaryFactorScore =
    energyType === "Wind"
      ? scoreWindSpeed(environmentalData.windSpeed)
      : scoreSolarIrradiance(environmentalData.solarIrradiance);

  const factors = [primaryFactorScore, elevationScore, roadsScore, powerScore];

  const validFactors = factors.filter((f) => f.points !== null);
  const score = validFactors.reduce((sum, f) => sum + f.points, 0);

  // Primary factor (irradiance/wind speed) and elevation are worth up to
  // 2 points each; roads and power infrastructure are worth up to 1 each.
  const maxScore = factors.reduce((sum, f, i) => {
    if (f.points === null) return sum;
    const weight = i < 2 ? 2 : 1;
    return sum + weight;
  }, 0);

  const reasons = factors.map((f) => f.reason).filter(Boolean);

  if (validFactors.length === 0) {
    reasons.push(
      "None of the environmental, terrain, or GIS data sources returned usable data — try running the analysis again."
    );
  }

  return {
    level: levelFromScore(score, maxScore),
    score,
    maxScore,
    reasons,
  };
}
