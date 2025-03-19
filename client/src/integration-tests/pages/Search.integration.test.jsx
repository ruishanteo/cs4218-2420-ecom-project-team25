import React from "react";
import axios from "axios";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import SearchInput from "../../components/Form/SearchInput";
import Search from "../../pages/Search";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider, useSearch } from "../../context/search";

jest.mock("axios");

Object.defineProperty(window, "matchMedia", {
  value: jest.fn(() => {
    return {
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  }),
});

const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>;
      </CartProvider>
    </AuthProvider>
  );
};

const SearchConsumer = () => {
  const [values] = useSearch();
  return (
    <div data-testid="context-value" hidden={true}>
      {values.keyword}
    </div>
  );
};

describe("SearchInput Component Integration Tests", () => {
  const SINGLE_DATA = [
    {
      _id: "1",
      name: "Product 1",
      description: "Description of Product 1",
      price: 100,
      slug: "product-1",
    },
  ];

  const MULTIPLE_DATA = [
    {
      _id: "1",
      name: "Product 1",
      description: "Description of Product 1",
      price: 100,
      slug: "product-1",
    },
    {
      _id: "2",
      name: "Product 2",
      description: "Description of Product 2",
      price: 200,
      slug: "product-2",
    },
  ];

  const KEYWORD = "Product 1";

  const setup = () => {
    return render(
      <MemoryRouter>
        <Providers>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <SearchInput />
                  <SearchConsumer />
                </>
              }
            />
            <Route
              path="/search"
              element={
                <>
                  <Search />
                  <SearchConsumer />
                </>
              }
            />
          </Routes>
        </Providers>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the search input and button", () => {
    setup();

    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("should allow the user to type in the search input", async () => {
    setup();

    const input = screen.getByRole("searchbox");

    fireEvent.change(input, { target: { value: KEYWORD } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(KEYWORD)).toBeInTheDocument();
    });
    expect(screen.getByTestId("context-value")).toHaveTextContent(KEYWORD);
  });

  it("should call axios.get and navigate on form submission", async () => {
    axios.get.mockResolvedValueOnce({ data: SINGLE_DATA });

    setup();

    const input = screen.getByRole("searchbox");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: KEYWORD } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Search Results")).toBeInTheDocument();
    });
    expect(screen.getByTestId("context-value")).toHaveTextContent(KEYWORD);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/Product 1");
  });

  it("should handle API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    setup();

    const input = screen.getByRole("searchbox");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: KEYWORD } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/search/Product 1"
      );
    });
    expect(screen.getByTestId("context-value")).toHaveTextContent(KEYWORD);
    expect(screen.queryByTestId("search-page")).not.toBeInTheDocument();
  });

  it("should render 'No Products Found' when there are no search results", async () => {
    // Mock the search context to return no results
    axios.get.mockResolvedValueOnce({ data: [] });

    setup();

    const input = screen.getByRole("searchbox");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "no-results" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Search Results")).toBeInTheDocument();
    });
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("should render search results when products are found", async () => {
    // Mock the search context to return some results
    axios.get.mockResolvedValueOnce({ data: MULTIPLE_DATA });

    setup();

    const input = screen.getByRole("searchbox");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "results" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Search Results")).toBeInTheDocument();
    });

    expect(screen.getByText("Found 2")).toBeInTheDocument();

    // Check that the products are rendered
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText("Description of Product 1...")).toBeInTheDocument();
    expect(screen.getByText("Description of Product 2...")).toBeInTheDocument();
    expect(screen.getByText("$ 100")).toBeInTheDocument();
    expect(screen.getByText("$ 200")).toBeInTheDocument();
  });

  it("should navigate to product details when 'More Details' is clicked", async () => {
    // Mock the search context to return some results
    axios.get.mockResolvedValueOnce({ data: SINGLE_DATA });

    setup();

    const input = screen.getByRole("searchbox");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "results" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Search Results")).toBeInTheDocument();
    });

    // Simulate clicking the "More Details" button
    const moreDetailsButton = screen.getByText("More Details");
    fireEvent.click(moreDetailsButton);
  });

  it("should add a product to the cart when 'ADD TO CART' is clicked", async () => {
    // Mock the search context to return some results
    axios.get.mockResolvedValueOnce({ data: SINGLE_DATA });

    setup();

    const input = screen.getByRole("searchbox");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "results" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Search Results")).toBeInTheDocument();
    });

    // Simulate clicking the "ADD TO CART" button
    const addToCartButton = screen.getByText("ADD TO CART");
    fireEvent.click(addToCartButton);

    // Assert that the product was added to the cart
    expect(localStorage.getItem("cart")).toContain("Product 1");
    expect(screen.getByText("Item Added to cart")).toBeInTheDocument();
  });
});
