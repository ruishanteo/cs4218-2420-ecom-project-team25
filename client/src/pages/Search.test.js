import React from "react";
import { useNavigate } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect";

import Search from "../pages/Search";
import { useSearch } from "../context/search";

// Mock dependencies
jest.mock("react-hot-toast");

jest.mock("../context/cart", () => ({
  useCart: jest.fn().mockReturnValue([[], () => {}]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

// Mock localStorage
const setItemMock = jest.fn();
Object.defineProperty(window, "localStorage", {
  value: {
    setItem: setItemMock,
  },
});

describe("Search Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the search component with no results message", () => {
    useSearch.mockReturnValue([{ results: [] }]);

    render(<Search />);

    expect(
      screen.getByRole("heading", { name: /no products found/i })
    ).toBeInTheDocument();
  });

  it("should render the search component with results", () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", description: "Description 1", price: 100 },
      { _id: "2", name: "Product 2", description: "Description 2", price: 200 },
    ];
    useSearch.mockReturnValue([{ results: mockProducts }]);

    render(<Search />);

    expect(
      screen.getByRole("heading", { name: /found 2/i })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(mockProducts.length);

    expect(
      screen.getByRole("heading", { name: mockProducts[0].name })
    ).toBeInTheDocument();
    expect(screen.getByText(`$ ${mockProducts[0].price}`)).toBeInTheDocument();
  });

  it("should correctly truncate product descriptions", () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      description:
        "This is a very long description exceeding thirty characters",
      price: 100,
    };
    useSearch.mockReturnValue([{ results: [mockProduct] }]);

    render(<Search />);

    expect(
      screen.getByText(`${mockProduct.description.substring(0, 30)}...`)
    ).toBeInTheDocument();
  });

  it("should navigate to the correct product page when 'More Details' is clicked", async () => {
    const navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);

    const mockProduct = [
      {
        _id: "1",
        name: "Product 1",
        description: "Description 1",
        price: 100,
        slug: "product-1",
      },
    ];

    useSearch.mockReturnValue([{ results: mockProduct }]);

    render(<Search />);

    const moreDetailsButton = screen.getByText("More Details");
    fireEvent.click(moreDetailsButton);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/product/product-1");
    });
  });

  it("should add the product to the cart and update localStorage when 'Add to Cart' is clicked", () => {
    const mockProduct = {
      _id: "1",
      name: "Product 1",
      slug: "product-1",
      description: "This is a test product",
      price: 100,
    };

    useSearch.mockReturnValue([{ results: [mockProduct] }]);

    render(<Search />);

    const addToCartButton = screen.getByText("ADD TO CART");
    fireEvent.click(addToCartButton);

    expect(setItemMock).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([mockProduct])
    );

    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });
});
