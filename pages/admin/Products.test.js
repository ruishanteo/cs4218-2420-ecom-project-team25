import React from "react";
import toast from "react-hot-toast";
import { render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

import Products, { API_URLS, PRODUCTS_STRINGS } from "./Products";

// Mock dependencies
jest.mock("axios");

jest.mock("react-router-dom", () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

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

    // Wait for the products to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("admin-products-list")).queryAllByTestId(
          /admin-product-/
        )
      ).toHaveLength(mockProducts.length)
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_PRODUCTS);
  });

  it("should display no products when API returns an empty array", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [], success: true } });

    render(<Products />);

    // Wait for the products to be displayed (0 products)
    await waitFor(() =>
      expect(
        within(screen.getByTestId("admin-products-list")).queryAllByTestId(
          /admin-product-/
        )
      ).toHaveLength(0)
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_PRODUCTS);
  });

  it("should display error message when get products fails", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false } });

    render(<Products />);

    // Wait for error message, API call and verify no products are displayed
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        PRODUCTS_STRINGS.FETCH_PRODUCTS_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_PRODUCTS);
    expect(
      within(screen.getByTestId("admin-products-list")).queryAllByTestId(
        /admin-product-/
      )
    ).toHaveLength(0);
  });

  it("should display error message when get products throws an exception", async () => {
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch products"));

    render(<Products />);

    // Wait for error message, API call and verify no products are displayed
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        PRODUCTS_STRINGS.FETCH_PRODUCTS_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_PRODUCTS);
    expect(
      within(screen.getByTestId("admin-products-list")).queryAllByTestId(
        /admin-product-/
      )
    ).toHaveLength(0);
  });
});
