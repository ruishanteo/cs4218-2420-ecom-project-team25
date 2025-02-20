import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import About from "./About";

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

// ensure react router context is available
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("About Page", () => {
  it("should render About page", () => {
    renderWithRouter(<About />);

    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/about.jpeg");
  });
});
