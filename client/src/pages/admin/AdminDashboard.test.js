import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/auth";

// Mock dependencies
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

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

    // Expect the AdminMenu component to be rendered with the correct props
    expect(screen.getByTestId("admin-name")).toHaveTextContent("Admin User");
    expect(screen.getByTestId("admin-email")).toHaveTextContent(
      "admin@example.com"
    );
    expect(screen.getByTestId("admin-contact")).toHaveTextContent("1234567890");
  });

  it("should display empty admin details when not authenticated", () => {
    useAuth.mockReturnValue([{ user: null, token: null }]);

    render(<AdminDashboard />);

    // Expect the AdminMenu component to be rendered with empty props
    expect(screen.getByTestId("admin-name")).toHaveTextContent("Admin Name :");
    expect(screen.getByTestId("admin-email")).toHaveTextContent(
      "Admin Email :"
    );
    expect(screen.getByTestId("admin-contact")).toHaveTextContent(
      "Admin Contact :"
    );
  });
});
