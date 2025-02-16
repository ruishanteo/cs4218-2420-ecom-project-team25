import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

import Users from "./Users";

// Mock dependencies
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

describe("Users Component", () => {
  it("should render the Layout component with the correct title", () => {
    render(<Users />);

    // Check if the Layout component is rendered with the correct title
    expect(screen.getByText("All Users")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });
});
