import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GisMap from "../pages/GisMap.jsx";

const mocks = vi.hoisted(() => ({
  getGisSites: vi.fn(),
}));

vi.mock("../api/projects.js", () => ({
  getGisSites: mocks.getGisSites,
}));

vi.mock("leaflet", () => {
  const chain = {
    addTo: vi.fn(() => chain),
    bindPopup: vi.fn(() => chain),
    clearLayers: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
    pad: vi.fn(() => chain),
    setView: vi.fn(() => chain),
  };
  return {
    default: {
      divIcon: vi.fn(() => ({})),
      latLngBounds: vi.fn(() => chain),
      layerGroup: vi.fn(() => chain),
      map: vi.fn(() => chain),
      marker: vi.fn(() => chain),
      tileLayer: vi.fn(() => chain),
    },
  };
});

const sites = [
  {
    id: 1,
    name: "Test Site 1",
    project_type: "Solar",
    suitability_level: "High",
    latitude: 20.5937,
    longitude: 78.9629,
    suitability_score: 85,
    solar_score: 90,
    wind_score: 45,
    recommended_technology: "Solar PV",
    capacity_mw: 50,
    annual_energy_output: 75000,
    roi_estimate: 12.5,
    environmental_information: { wind_speed: 3, solar_irradiance: 5.5 },
  },
];

describe("GIS Map Page", () => {
  beforeEach(() => {
    mocks.getGisSites.mockReset();
  });

  it("renders GIS map controls and legend", async () => {
    mocks.getGisSites.mockResolvedValue({ sites });

    render(<GisMap />);

    expect(await screen.findByText("GIS Visualization")).toBeInTheDocument();
    expect(screen.getByText("Analyzed Site Map")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset map/i })).toBeInTheDocument();
    expect(screen.getAllByText("High").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Medium").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Low").length).toBeGreaterThan(0);
  });

  it("filters sites by suitability and technology", async () => {
    const user = userEvent.setup();
    mocks.getGisSites.mockResolvedValue({ sites });

    render(<GisMap />);

    await screen.findByText("GIS Visualization");
    await user.selectOptions(screen.getAllByRole("combobox")[0], "High");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "Solar");

    expect(screen.queryByText("No site analyses available.")).not.toBeInTheDocument();
  });

  it("shows an error message on API failure", async () => {
    mocks.getGisSites.mockRejectedValue(new Error("API Error"));

    render(<GisMap />);

    expect(await screen.findByText(/unable to load gis sites/i)).toBeInTheDocument();
  });

  it("displays empty state when there are no sites", async () => {
    mocks.getGisSites.mockResolvedValue({ sites: [] });

    render(<GisMap />);

    expect(await screen.findByText("No site analyses available.")).toBeInTheDocument();
  });
});
