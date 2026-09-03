import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Projects from "../pages/Projects.jsx";

const mocks = vi.hoisted(() => ({
  getProjects: vi.fn(),
  saveProject: vi.fn(),
  reverseGeocode: vi.fn(),
  fetchEnvironment: vi.fn(),
  runPredictions: vi.fn(),
}));

vi.mock("../api/projects.js", () => ({
  getProjects: mocks.getProjects,
  saveProject: mocks.saveProject,
  reverseGeocode: mocks.reverseGeocode,
  fetchEnvironment: mocks.fetchEnvironment,
  runPredictions: mocks.runPredictions,
}));

const projects = [
  { id: 1, name: "Test Project 1", project_type: "Solar", region: "Rajasthan", capacity_mw: 50, suitability_score: 85 },
];

describe("Projects Page", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getProjects.mockResolvedValue([]);
  });

  it("renders the project creation form", async () => {
    render(<Projects />);

    expect(await screen.findByText("Create Project")).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/capacity mw/i)).toBeInTheDocument();
  });

  it("loads existing projects into history", async () => {
    mocks.getProjects.mockResolvedValue(projects);

    render(<Projects />);

    expect(await screen.findByText("Test Project 1")).toBeInTheDocument();
    expect(screen.getByText("Project History")).toBeInTheDocument();
    expect(screen.getAllByText("Solar").length).toBeGreaterThan(0);
    expect(screen.getByText("Rajasthan")).toBeInTheDocument();
  });

  it("does not save until location data and predictions are ready", async () => {
    const user = userEvent.setup();
    render(<Projects />);

    await screen.findByText("Create Project");
    await user.click(screen.getByRole("button", { name: /save project/i }));

    expect(mocks.saveProject).not.toHaveBeenCalled();
  });

  it("keeps the page usable when project loading fails", async () => {
    mocks.getProjects.mockRejectedValue(new Error("Server error"));

    render(<Projects />);

    expect(await screen.findByText("Create Project")).toBeInTheDocument();
    await waitFor(() => expect(mocks.getProjects).toHaveBeenCalled());
  });

  it("shows environmental and prediction placeholders before a map selection", async () => {
    render(<Projects />);

    expect(await screen.findByText("Automatic Environmental Data")).toBeInTheDocument();
    expect(screen.getByText(/predictions run automatically/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save project/i })).toBeDisabled();
  });
});
