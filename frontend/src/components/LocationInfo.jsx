function LocationInfo() {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        marginTop: "20px",
      }}
    >
      <h2>📍 Selected Location</h2>

      <p>Latitude: --</p>
      <p>Longitude: --</p>
      <p>State: --</p>
      <p>Country: --</p>
    </div>
  );
}

export default LocationInfo;