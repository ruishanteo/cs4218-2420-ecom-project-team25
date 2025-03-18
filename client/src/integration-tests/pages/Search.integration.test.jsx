import React from "react";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import Search from "../../pages/Search";
import SearchInput from "../../components/Form/SearchInput";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";

jest.mock("axios");

const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("Search Integration Tests", () => {
  const setup = () => {
    return render(
      <Providers>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<SearchInput />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </MemoryRouter>
      </Providers>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should render 'No Products Found' when there are no search results", () => {
    // Mock the search context to return no results
    axios.get.mockResolvedValueOnce({ data: [] });

    setup();

    expect(screen.getByText("Search Results")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("should render search results when products are found", async () => {
    // Mock the search context to return some results
    axios.get.mockResolvedValueOnce({
      data: [
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
      ],
    });

    setup();

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
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          name: "Product 1",
          description: "Description of Product 1",
          price: 100,
          slug: "product-1",
        },
      ],
    });

    const { container } = setup();

    // Simulate clicking the "More Details" button
    const moreDetailsButton = screen.getByText("More Details");
    fireEvent.click(moreDetailsButton);
  });

  it("should add a product to the cart when 'ADD TO CART' is clicked", () => {
    // Mock the search context to return some results
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          name: "Product 1",
          description: "Description of Product 1",
          price: 100,
          slug: "product-1",
        },
      ],
    });

    setup();

    // Simulate clicking the "ADD TO CART" button
    const addToCartButton = screen.getByText("ADD TO CART");
    fireEvent.click(addToCartButton);

    // Assert that the product was added to the cart
    expect(localStorage.getItem("cart")).toContain("Product 1");
    expect(screen.getByText("Item Added to cart")).toBeInTheDocument();
  });
});
