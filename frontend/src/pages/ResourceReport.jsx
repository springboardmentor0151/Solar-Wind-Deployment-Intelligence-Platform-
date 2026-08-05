import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";

export default function ResourceReport() {
  const { state } = useLocation();

  if (!state) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>No Report Data Available</h2>
      </div>
    );
  }

  const {
    siteName,
    latitude,
    longitude,
    location,
    taluk,
    district,
    stateName,
    country,
    landArea,
    elevation,
    temperature,
    windSpeed,
    rainfall,
    solarRadiation,
    infrastructure,
    ownership,
    prediction,
  } = state;

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Renewable Energy Resource Assessment Report", 20, 20);

    doc.setFontSize(12);

    doc.text("Site Information", 20, 35);

    doc.text(`Site Name : ${siteName}`, 20, 45);
    doc.text(`Latitude : ${latitude}`, 20, 55);
    doc.text(`Longitude : ${longitude}`, 20, 65);

    doc.text(`Location : ${location}`, 20, 75);
    doc.text(`Taluk : ${taluk}`, 20, 85);
    doc.text(`District : ${district}`, 20, 95);
    doc.text(`State : ${stateName}`, 20, 105);
    doc.text(`Country : ${country}`, 20, 115);

    doc.text("Environmental Details", 20, 130);

    doc.text(`Temperature : ${temperature} °C`, 20, 140);
    doc.text(`Wind Speed : ${windSpeed} km/h`, 20, 150);
    doc.text(`Rainfall : ${rainfall} mm`, 20, 160);
    doc.text(`Solar Radiation : ${solarRadiation} W/m²`, 20, 170);
    doc.text(`Elevation : ${elevation} m`, 20, 180);

    doc.text("Land Information", 20, 195);

    doc.text(`Land Area : ${landArea} Acres`, 20, 205);
    doc.text(`Infrastructure : ${infrastructure}`, 20, 215);
    doc.text(`Ownership : ${ownership}`, 20, 225);

    doc.addPage();

    doc.setFontSize(18);
    doc.text("AI Assessment", 20, 20);

    doc.setFontSize(12);

    doc.text(`Prediction : ${prediction}`, 20, 40);

    doc.text("Recommendation", 20, 60);

    if (prediction === "Suitable") {
      doc.text("✔ Suitable for Renewable Energy Deployment", 20, 75);
      doc.text("✔ Good Solar Resource", 20, 85);
      doc.text("✔ Wind Resource Available", 20, 95);
      doc.text("✔ Site Recommended for Development", 20, 105);
    } else {
      doc.text("✘ Site Not Recommended", 20, 75);
      doc.text("Consider another location.", 20, 85);
    }

    doc.text(
      `Generated On : ${new Date().toLocaleString()}`,
      20,
      130
    );

    doc.save("Resource_Assessment_Report.pdf");
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "auto",
        padding: "30px",
      }}
    >
      <h1>🌍 Renewable Energy Resource Assessment Report</h1>

      <hr />

      <h2>📍 Site Information</h2>

      <p><b>Site Name:</b> {siteName}</p>
      <p><b>Latitude:</b> {latitude}</p>
      <p><b>Longitude:</b> {longitude}</p>
      <p><b>Location:</b> {location}</p>
      <p><b>Taluk:</b> {taluk}</p>
      <p><b>District:</b> {district}</p>
      <p><b>State:</b> {stateName}</p>
      <p><b>Country:</b> {country}</p>

      <hr />

      <h2>🌤 Environmental Details</h2>

      <p><b>Temperature:</b> {temperature} °C</p>
      <p><b>Wind Speed:</b> {windSpeed} km/h</p>
      <p><b>Rainfall:</b> {rainfall} mm</p>
      <p><b>Solar Radiation:</b> {solarRadiation} W/m²</p>
      <p><b>Elevation:</b> {elevation} m</p>

      <hr />

      <h2>🌱 Land Information</h2>

      <p><b>Land Area:</b> {landArea} Acres</p>
      <p><b>Infrastructure:</b> {infrastructure}</p>
      <p><b>Ownership:</b> {ownership}</p>

      <hr />

      <h2>🤖 AI Assessment</h2>

      <h3>{prediction}</h3>

      <hr />

      <h2>✅ Recommendation</h2>

      {prediction === "Suitable" ? (
        <ul>
          <li>Suitable for Renewable Energy Deployment</li>
          <li>Good Solar Resource</li>
          <li>Wind Resource Available</li>
          <li>Recommended for Development</li>
        </ul>
      ) : (
        <ul>
          <li>Site Not Recommended</li>
          <li>Choose another location for better efficiency.</li>
        </ul>
      )}

      <button
        onClick={downloadPDF}
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: "8px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        📄 Download PDF Report
      </button>
    </div>
  );
}