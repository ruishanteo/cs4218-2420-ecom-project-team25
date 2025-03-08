import React from "react";
import toast from "react-hot-toast";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

import Products, { API_URLS, PRODUCTS_STRINGS } from "./Products";

jest.mock("axios");

jest.mock("react-router-dom", () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <nav>Mock AdminMenu</nav>);

describe("Products Component", () => {
  const mockProducts = [
    {
      _id: "1",
      name: "Product 1",
      description: "Description of product 1",
      slug: "product-1",
    },
    {
      _id: "2",
      name: "Product 2",
      description: "Description of product 2",
      slug: "product-2",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display products when API call is successful", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts, success: true },
    });
    render(<Products />);

    await waitFor(() => {
      mockProducts.forEach((product) => {
        expect(
          screen.getByRole("heading", { name: product.name })
        ).toBeInTheDocument();
        expect(screen.getByText(product.description)).toBeInTheDocument();
      });
    });
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_PRODUCTS);
  });

  it("should not display any products when API returns an empty array", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [], success: true } });
    render(<Products />);

    await waitFor(() => {
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_PRODUCTS);
  });

  it("should display error message when API response is unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false } });
    render(<Products />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        PRODUCTS_STRINGS.FETCH_PRODUCTS_ERROR
      );
    });
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_PRODUCTS);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should display error message when API request fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch products"));
    render(<Products />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        PRODUCTS_STRINGS.FETCH_PRODUCTS_ERROR
      );
    });
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_PRODUCTS);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
