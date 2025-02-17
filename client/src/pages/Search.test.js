import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

import Search from "../pages/Search";
import { useSearch } from "../context/search";

// Mock dependencies
jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

describe("Search Component", () => {
  it("should render the search component with no results message", () => {
    useSearch.mockReturnValue([{ results: [] }]);

    render(<Search />);

    expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("should render the search component with results", () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", description: "Description 1", price: 100 },
      { _id: "2", name: "Product 2", description: "Description 2", price: 200 },
    ];
    const firstId = mockProducts[0]._id;

    useSearch.mockReturnValue([{ results: mockProducts }]);

    render(<Search />);

    expect(screen.getByTestId("search-results")).toBeInTheDocument();
    expect(screen.getByText("Found 2")).toBeInTheDocument();
    expect(screen.getAllByTestId(/search-product-/)).toHaveLength(
      mockProducts.length
    );

    expect(screen.getByTestId(`product-name-${firstId}`)).toHaveTextContent(
      mockProducts[0].name
    );
    expect(screen.getByTestId(`product-price-${firstId}`)).toHaveTextContent(
      `$ ${mockProducts[0].price}`
    );
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
      screen.getByTestId(`product-truncated-desc-${mockProduct._id}`)
    ).toHaveTextContent(`${mockProduct.description.substring(0, 30)}...`);
  });
});
