import API from "./api";

export const analyzeLocation = async (
  latitude,
  longitude
) => {
  try {
    const response = await API.post(
      "/analyze",
      {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      {
        timeout: 30000,
      }
    );

    return response.data;

  } catch (error) {

    console.error(
      "Analyze Location Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};