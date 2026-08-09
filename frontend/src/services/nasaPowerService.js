export const fetchClimateData = async (latitude, longitude) => {
  try {
    const url =
      `https://power.larc.nasa.gov/api/temporal/climatology/point` +
      `?parameters=ALLSKY_SFC_SW_DWN,T2M,WS10M` +
      `&community=RE` +
      `&longitude=${longitude}` +
      `&latitude=${latitude}` +
      `&format=JSON`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch NASA POWER data");
    }

    const data = await response.json();

    const parameters = data.properties.parameter;

    return {
      solarIrradiance: parameters.ALLSKY_SFC_SW_DWN.ANN,
      temperature: parameters.T2M.ANN,
      windSpeed: parameters.WS10M.ANN,
    };
  } catch (error) {
    console.error("NASA POWER API Error:", error);
    throw error;
  }
};