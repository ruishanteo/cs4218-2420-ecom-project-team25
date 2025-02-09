import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import UserMenu from "./UserMenu";
import "@testing-library/jest-dom";

describe("UserMenu", () => {
  it("renders UserMenu correctly", () => {
    render(
      <Router>
        <UserMenu />
      </Router>
    );

    // Check if the heading "Dashboard" is rendered
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();

    // Check if the Profile link is rendered with the correct URL
    const profileLink = screen.getByText(/Profile/i);
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/user/profile"
    );

    // Check if the Orders link is rendered with the correct URL
    const ordersLink = screen.getByText(/Orders/i);
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/user/orders"
    );
  });

  it("has correct class names for links", () => {
    render(
      <Router>
        <UserMenu />
      </Router>
    );

    // Check if the Profile link has the correct classes
    const profileLink = screen.getByText(/Profile/i);
    expect(profileLink).toHaveClass("list-group-item");
    expect(profileLink).toHaveClass("list-group-item-action");

    // Check if the Orders link has the correct classes
    const ordersLink = screen.getByText(/Orders/i);
    expect(ordersLink).toHaveClass("list-group-item");
    expect(ordersLink).toHaveClass("list-group-item-action");
  });
});
