import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Footer from "./Footer";
import "@testing-library/jest-dom";

describe("Footer", () => {
  // Test if the footer is rendered correctly
  it("renders the footer content", () => {
    render(
      <Router>
        <Footer />
      </Router>
    );

    // Check if the main heading is in the document
    expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();
  });

  // Test if the links are rendered correctly
  it("renders the footer links", () => {
    render(
      <Router>
        <Footer />
      </Router>
    );

    // Check if the "About", "Contact", and "Privacy Policy" links are present
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
  });

  // Test if the links have the correct 'href' values
  it("has the correct links", () => {
    render(
      <Router>
        <Footer />
      </Router>
    );

    // Check if the links point to the correct URLs
    expect(screen.getByText(/About/i).closest("a")).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByText(/Contact/i).closest("a")).toHaveAttribute(
      "href",
      "/contact"
    );
    expect(screen.getByText(/Privacy Policy/i).closest("a")).toHaveAttribute(
      "href",
      "/policy"
    );
  });
});
