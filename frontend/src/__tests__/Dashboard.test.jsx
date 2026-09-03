import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "../pages/Home.jsx";

const mocks = vi.hoisted(() => ({
  getDashboard: vi.fn(),
}));

vi.mock("../api/projects.js", () => ({
  getDashboard: mocks.getDashboard,
}));

const dashboardData = {
  total_projects: 5,
  total_analyzed_sites: 5,
  suitable_sites: 3,
  highly_suitable_sites: 2,
  average_site_score: 75.5,
  solar_potential: 78.2,
  wind_potential: 65.4,
  estimated_capacity_mw: 250,
  estimated_energy_generation_mwh: 450000,
  estimated_investment: "$3,000,000",
  estimated_roi: 12.5,
  recommended_technology: "Solar",
  suitability_distribution: { High: 2, Medium: 2, Low: 1, Unsuitable: 0, "No data": 0 },
  technology_comparison: { Solar: 3, Wind: 1, Hybrid: 1 },
  environmental_averages: { solar_irradiance: 5.5, wind_speed: 4.2, temperature: 25 },
  investment_analytics: {
    average_roi: 12.5,
    average_investment_score: 72,
    average_capacity_factor: 28.5,
    estimated_annual_generation_mwh: 450000,
  },
  latest_projects: [{ id: 1, name: "Test Project 1", project_type: "Solar", region: "Rajasthan", capacity_mw: 50, suitability_score: 85 }],
  recent_reports: [],
};

describe("Dashboard Page", () => {
  beforeEach(() => {
    mocks.getDashboard.mockReset();
  });

  it("renders KPIs, charts, and latest projects", async () => {
    mocks.getDashboard.mockResolvedValue(dashboardData);

    render(<Home />);

    expect(await screen.findByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("Analyzed Sites")).toBeInTheDocument();
    expect(screen.getByText("Suitable Sites")).toBeInTheDocument();
    expect(screen.getByText("Suitability Distribution")).toBeInTheDocument();
    expect(screen.getByText("Technology Comparison")).toBeInTheDocument();
    expect(screen.getByText("Environmental Factors")).toBeInTheDocument();
    expect(screen.getByText("Test Project 1")).toBeInTheDocument();
    expect(screen.getByText("Investment Analytics")).toBeInTheDocument();
    expect(screen.getByText(/250 MW/)).toBeInTheDocument();
    expect(screen.getByText("Estimated Generation")).toBeInTheDocument();
  });

  it("shows an error message on API failure", async () => {
    mocks.getDashboard.mockRejectedValue(new Error("API Error"));

    render(<Home />);

    expect(await screen.findByText(/unable to load executive analytics/i)).toBeInTheDocument();
  });

  it("handles empty data gracefully", async () => {
    mocks.getDashboard.mockResolvedValue({ total_projects: 0, latest_projects: [] });

    render(<Home />);

    expect(await screen.findByText("No projects available.")).toBeInTheDocument();
  });
});
