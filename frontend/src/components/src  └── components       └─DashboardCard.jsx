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
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        borderLeft: `6px solid ${color}`,
        transition: ".3s",
      }}
    >
      <div
        style={{
          fontSize: "32px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          marginTop: "10px",
          color: "#374151",
        }}
      >
        {title}
      </h3>

      <h2
        style={{
          color: color,
          marginTop: "10px",
          fontWeight: "700",
        }}
      >
        {value || "--"} {unit}
      </h2>
    </div>
  );
}