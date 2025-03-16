import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/auth";

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <div>Mock AdminMenu</div>);

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("AdminDashboard Component", () => {
  it("should display admin details when authenticated", () => {
    const mockAuthData = {
      user: {
        name: "Admin User",
        email: "admin@example.com",
        phone: "1234567890",
      },
      token: "valid-token",
    };
    useAuth.mockReturnValue([mockAuthData]);

    render(<AdminDashboard />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: /admin name : admin user/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: /admin email : admin@example.com/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: /admin contact : 1234567890/i,
      })
    ).toBeInTheDocument();
  });

  it("should display empty admin details when not authenticated", () => {
    useAuth.mockReturnValue([{ user: null, token: null }]);

    render(<AdminDashboard />);

    expect(
      screen.getByRole("heading", { level: 3, name: /admin name :/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /admin email :/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /admin contact :/i })
    ).toBeInTheDocument();
  });
});
