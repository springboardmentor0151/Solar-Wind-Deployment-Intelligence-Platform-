import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";


describe("application shell", () => {
  it("renders the login page route when no session exists", () => {
    localStorage.clear();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });
});
