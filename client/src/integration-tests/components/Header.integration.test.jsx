import React from "react";
import axios from "axios";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import Header from "../../components/Header";
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

describe("Header Integration Tests", () => {
  const mockUserData = {
    user: {
      name: "User",
      email: "user@example.com",
      phone: "9876543210",
    },
    token: "valid-token",
  };

  const mockCategories = [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Books", slug: "books" },
    { _id: "3", name: "Clothing", slug: "clothing" },
  ];

  const setAuthInLocalStorage = (authData) => {
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  const clearAuthFromLocalStorage = () => {
    localStorage.removeItem("auth");
  };

  const mockAxiosGetCategories = ({
    failCategoryFetch = false,
    emptyCategoryList = false,
  } = {}) => {
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          if (failCategoryFetch) {
            return Promise.reject(new Error("Failed to fetch categories"));
          }
          return Promise.resolve({
            data: {
              success: true,
              category: emptyCategoryList ? [] : mockCategories,
            },
          });
        default:
          return Promise.reject(new Error("Not Found"));
      }
    });
  };

  const setup = () => {
    return render(
      <Providers>
        <MemoryRouter>
          <Header />
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

  it("should display correct links when not logged in", () => {
    clearAuthFromLocalStorage();
    mockAxiosGetCategories();
    setup();

    expect(screen.getByText("🛒 Virtual Vault")).toBeInTheDocument();

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Cart")).toBeInTheDocument();
  });

  it("should display correct links when logged in", () => {
    setAuthInLocalStorage(mockUserData);
    mockAxiosGetCategories();
    setup();

    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();

    // Ensure Register and Login links are not visible
    expect(screen.queryByText("Register")).not.toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });

  it("should not display category list in the dropdown when not logged in", async () => {
    clearAuthFromLocalStorage();
    mockAxiosGetCategories();
    setup();

    fireEvent.click(screen.getByText("Categories"));

    await waitFor(() => {
      expect(screen.getByText("All Categories")).toBeInTheDocument();
      expect(screen.queryByText("Books")).not.toBeInTheDocument();
      expect(screen.queryByText("Clothing")).not.toBeInTheDocument();
      expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    });
  });

  it("should display category list in the dropdown when logged in", async () => {
    setAuthInLocalStorage(mockUserData);
    mockAxiosGetCategories();
    setup();

    fireEvent.click(screen.getByText("Categories"));

    await waitFor(() => {
      expect(screen.getByText("All Categories")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
      expect(screen.getByText("Clothing")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
  });

  it("should handle logout correctly", () => {
    setAuthInLocalStorage(mockUserData);
    mockAxiosGetCategories();
    setup();

    fireEvent.click(screen.getByText("Logout"));

    // Check that the user is logged out
    expect(localStorage.getItem("auth")).toBeNull();
    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("should display the correct cart badge count", () => {
    setAuthInLocalStorage(mockUserData);
    mockAxiosGetCategories();
    const mockCart = [{ id: 1 }, { id: 2 }];
    localStorage.setItem("cart", JSON.stringify(mockCart));

    setup();

    // Check the cart badge count
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
