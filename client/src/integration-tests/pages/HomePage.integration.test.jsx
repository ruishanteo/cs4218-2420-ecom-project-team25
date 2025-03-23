import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import "@testing-library/jest-dom";

import HomePage from "../../pages/HomePage";
import { describe } from "node:test";
import { CartProvider } from "../../context/cart";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";

// heavily reuses the code from the HomePage unit tests
jest.mock("axios");

describe("HomePage Integration Tests", () => {
  const perPage = 2;
  const mockedCategories = [
    { _id: "1", name: "Test Category 1", slug: "test-category-1" },
    { _id: "2", name: "Test Category 2", slug: "test-category-2" },
    { _id: "3", name: "Test Category 3", slug: "test-category-3" },
  ];
  const mockedProducts = [
    {
      _id: "1",
      name: "Test Product 1",
      slug: "test-product-1",
      description:
        "This is a test product description that is longer than 60 characters.",
      price: 10.99,
      categories: [mockedCategories[0]],
    },
    {
      _id: "2",
      name: "Test Product 2",
      slug: "test-product-2",
      description:
        "Another test product description that is longer than 60 characters.",
      price: 1149.99,
      categories: [mockedCategories[1]],
    },
    {
      _id: "3",
      name: "Test Product 3",
      slug: "test-product-3",
      description:
        "Another test product description that is longer than 60 characters.",
      price: 10.99,
      categories: [mockedCategories[1]],
    },
    {
      _id: "4",
      name: "Test Product 4",
      slug: "test-product-4",
      description:
        "Another test product description that is longer than 60 characters.",
      price: 1149.99,
      categories: [mockedCategories[2]],
    },
  ];

  const mockAxiosGet = ({
    noProductsFound = false,
    failProductsFetch = false,
  } = {}) => {
    axios.get.mockImplementation((url, { params }) => {
      if (noProductsFound) {
        return Promise.resolve({ data: { products: [], hasMore: false } });
      }

      if (failProductsFetch) {
        return Promise.reject(new Error("Failed to fetch products"));
      }

      const page = parseInt(params.page || 1, 10);
      const minPrice = parseInt(params.minPrice, 10) || 0;
      const maxPrice = parseInt(params.maxPrice, 10) || Number.MAX_VALUE;
      const categories = params.categories ? params.categories.split(",") : [];

      let filteredProducts = mockedProducts.filter(
        (p) => p.price >= minPrice && p.price <= maxPrice
      );

      if (categories.length > 0) {
        filteredProducts = filteredProducts.filter((p) =>
          p.categories.some((c) => categories.includes(c._id))
        );
      }
      const start = (page - 1) * perPage;
      const end = start + perPage;
      return Promise.resolve({
        data: {
          products: filteredProducts.slice(start, end),
          hasMore: end < filteredProducts.length,
        },
      });
    });
  };

  const setup = async (waitForProucts = true) => {
    render(
      <BrowserRouter>
        <CartProvider>
          <AuthProvider>
            <SearchProvider>
              <HomePage />
            </SearchProvider>
          </AuthProvider>
        </CartProvider>
      </BrowserRouter>
    );

    if (waitForProucts) {
      expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // mocking matchMedia inspired by: https://chatgpt.com/share/67e0179c-6154-8004-ab85-958f6c42315b
  beforeAll(() => {
    global.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it("should add items to actual cart", async () => {
    mockAxiosGet();
    await setup();
    
    fireEvent.click(screen.getAllByText("ADD TO CART")[0]);
    expect(screen.getByText("Item Added to cart")).toBeInTheDocument();
    expect(window.localStorage.getItem("cart")).toBe(
      JSON.stringify([ mockedProducts[0] ])
    );
  });

  it('should navigate away when "More Details" button is clicked', async () => {
    mockAxiosGet();
    await setup();
    
    fireEvent.click(screen.getByTestId("1-more-details-btn"));
    
    await waitFor(() => {
      expect(global.window.location.pathname).toContain("/product/test-product-1");
    })
  });

  it('should toast with an error when product fetch fails', async () => {
    // reused entirely from HomePage unit tests
    mockAxiosGet({ failProductsFetch: true });

    await act(async () => {
      await setup(false);
    });

    await waitFor(async () =>
      expect(await screen.findByText("Error in getting products")).toBeInTheDocument()
    );
    expect(await screen.findByText("No Product Found")).toBeInTheDocument();
  });

  it('should toast with an error when loading more products fail', async () => {
    // load the page first
    mockAxiosGet();
    await setup();

    // make get fail here
    mockAxiosGet({ failProductsFetch: true });
    fireEvent.click(screen.getByText("Loadmore"));

    await waitFor(async () => {
      expect(await screen.findByText("Error in getting more products")).toBeInTheDocument();
    });
  });
});