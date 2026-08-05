export default function DashboardCard({
  title,
  value,
  unit,
  icon,
  color,
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "15px",
        padding: "20px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
        borderLeft: `6px solid ${color}`,
        transition: "0.3s",
      }}
    >
      <div
        style={{
          fontSize: "40px",
          marginBottom: "10px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          color: "#555",
          marginBottom: "10px",
        }}
      >
        {title}
      </h3>

      <h1
        style={{
          color: color,
          margin: 0,
          fontSize: "32px",
        }}
      >
        {value || "--"} {unit}
      </h1>
    </div>
  );
}