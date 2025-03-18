import React from "react";
import axios from "axios";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom";

import SearchInput from "../../../components/Form/SearchInput";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider, useSearch } from "../../../context/search";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));
jest.mock("../../../context/search", () => ({
  ...jest.requireActual("../../../context/search"),
  useSearch: jest.fn(),
}));

const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>;
      </CartProvider>
    </AuthProvider>
  );
};

describe("SearchInput Component Integration Tests", () => {
  let mockNavigate;
  let mockSetValues;
  let mockValues;

  const setup = () => {
    return render(
      <MemoryRouter>
        <Providers>
          <Routes>
            <Route path="/" element={<SearchInput />} />
          </Routes>
        </Providers>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();

    mockSetValues = jest.fn((newValues) => {
      mockValues = { ...mockValues, ...newValues };
    });
    mockValues = { keyword: "", results: [] }; // Initialize mockValues
    useNavigate.mockReturnValue(mockNavigate);
    useSearch.mockReturnValue([mockValues, mockSetValues]);
  });

  it("should render the search input and button", () => {
    setup();

    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("should allow the user to type in the search input", () => {
    setup();

    const input = screen.getByPlaceholderText("Search");

    // Simulate typing in the input
    fireEvent.change(input, { target: { value: "laptop" } });

    // Check if the input value is updated
    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: "laptop",
      results: [],
    });
    expect(input.value).toBe("laptop");
  });

  it("should call axios.get and navigate on form submission", async () => {
    const mockData = { products: [{ id: 1, name: "Laptop" }] };
    axios.get.mockResolvedValueOnce({ data: mockData });

    setup();

    const input = screen.getByPlaceholderText("Search");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "laptop" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "laptop",
        results: mockData,
      });
      expect(mockNavigate).toHaveBeenCalledWith("/search");
    });
  });

  it("should handle API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    setup();

    const input = screen.getByPlaceholderText("Search");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "laptop" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
      expect(mockSetValues).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
