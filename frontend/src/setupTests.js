import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

globalThis.fetch = vi.fn();

vi.mock("react-chartjs-2", () => ({
  Bar: () => React.createElement("canvas", { "data-testid": "bar-chart" }),
  Doughnut: () => React.createElement("canvas", { "data-testid": "doughnut-chart" }),
  Line: () => React.createElement("canvas", { "data-testid": "line-chart" }),
  Radar: () => React.createElement("canvas", { "data-testid": "radar-chart" }),
}));
