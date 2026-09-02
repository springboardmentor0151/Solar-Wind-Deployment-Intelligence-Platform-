function RecommendationCard({ result }) {
  return (
    <div className="dashboard-card">

      <h2>🤖 AI Recommendation</h2>

      <p className="recommendation-text">
        {result
          ? result.recommendation
          : "Select a location to get a renewable energy recommendation."}
      </p>

      {result && (
        <strong>
          Renewable Energy Potential
        </strong>
      )}

    </div>
  );
}

export default RecommendationCard;