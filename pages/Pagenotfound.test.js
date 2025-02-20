import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Pagenotfound from "./Pagenotfound";

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

describe("Pagenotfound Page", () => {
  it("should render Pagenotfound page", () => {
    renderWithRouter(<Pagenotfound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go Back" })).toBeInTheDocument();
  });
});
