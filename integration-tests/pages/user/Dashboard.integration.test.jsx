import "@testing-library/jest-dom";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import Dashboard from "../../../pages/user/Dashboard";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import Layout from "../../../components/Layout";
import axios from "axios";


jest.mock("axios");

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
              <Layout>{ui}</Layout>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe("Dashboard Component", () => {
  const mockUser = {
    name: "John Doe",
    email: "john@gmail.com",
    address: "NUS, Singapore",
  };

  it("should render user details", () => {
    localStorage.setItem("auth", JSON.stringify({ user: mockUser }));
    renderWithProviders(<Dashboard />);

    expect(screen.getByRole("heading", { name: mockUser.name })).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.address)).toBeInTheDocument();
  });

  it("should render dashboard without user details if no user", () => {
    localStorage.removeItem("auth");
    renderWithProviders(<Dashboard />);

    expect(screen.queryByText(mockUser.name)).toBeNull();
    expect(screen.queryByText(mockUser.email)).toBeNull();
    expect(screen.queryByText(mockUser.address)).toBeNull();
  });
});
