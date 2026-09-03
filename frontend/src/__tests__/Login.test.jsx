import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Login from "../pages/Login.jsx";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({
    login: mocks.login,
    user: null,
    loading: false,
  }),
}));

const renderLogin = () => render(<Login />, { wrapper: MemoryRouter });

describe("Login Page", () => {
  beforeEach(() => {
    mocks.login.mockReset();
    mocks.navigate.mockReset();
  });

  it("renders login form", () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("does not submit empty required fields", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("shows error for invalid credentials", async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValue({ response: { data: { detail: "Invalid email or password" } } });
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it("successfully logs in and navigates", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/"));
  });
});
