import React from "react";
import axios from "axios";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import SearchInput from "../../../components/Form/SearchInput";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider, useSearch } from "../../../context/search";

jest.mock("axios");

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

const SearchPage = () => {
  return (
    <div data-testid="search-page">
      <SearchConsumer />
    </div>
  );
};

describe("SearchInput Component Integration Tests", () => {
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
            <Route path="/search" element={<SearchPage />} />
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

    fireEvent.change(input, { target: { value: "laptop" } });

    await waitFor(() => {
      expect(screen.getByDisplayValue("laptop")).toBeInTheDocument();
    });
    expect(screen.getByTestId("context-value")).toHaveTextContent("laptop");
  });

  it("should call axios.get and navigate on form submission", async () => {
    const mockData = { products: [{ id: 1, name: "Laptop" }] };
    axios.get.mockResolvedValueOnce({ data: mockData });

    setup();

    const input = screen.getByRole("searchbox");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "laptop" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("search-page")).toBeInTheDocument();
    });

    expect(screen.getByTestId("context-value")).toHaveTextContent("laptop");
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
  });

  it("should handle API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    setup();

    const input = screen.getByRole("searchbox");
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "laptop" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
    });
    expect(screen.getByTestId("context-value")).toHaveTextContent("laptop");
    expect(screen.queryByTestId("search-page")).not.toBeInTheDocument();
  });
});
