import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import "@testing-library/jest-dom";

describe("AdminMenu", () => {
  // Test to check if the AdminMenu renders properly
  it("renders AdminMenu component", () => {
    render(
      <Router>
        <AdminMenu />
      </Router>
    );

    // Check if the Admin Panel header is in the document
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
  });

  // Test to check if the menu items are displayed
  it("renders menu items", () => {
    render(
      <Router>
        <AdminMenu />
      </Router>
    );

    // Check for the menu items
    expect(screen.getByText(/Create Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Product/i)).toBeInTheDocument();
    expect(screen.getByText(/Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Orders/i)).toBeInTheDocument();
    expect(screen.getByText(/Users/i)).toBeInTheDocument();
  });

  // Test to check if the links have correct `to` attributes
  it("has correct link paths", () => {
    render(
      <Router>
        <AdminMenu />
      </Router>
    );

    // Check the links' `to` attribute values
    expect(screen.getByText(/Create Category/i).closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/create-category"
    );
    expect(screen.getByText(/Create Product/i).closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product"
    );
    expect(screen.getByText(/Products/i).closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/products"
    );
    expect(screen.getByText(/Orders/i).closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/orders"
    );
    expect(screen.getByText(/Users/i).closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/users"
    );
  });
});
