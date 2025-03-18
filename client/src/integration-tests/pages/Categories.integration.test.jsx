import React from "react";
import axios from "axios";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import Categories from "../../pages/Categories";
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

describe("Categories Integration Tests", () => {
  const setup = () => {
    return render(
      <Providers>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Header />} />
            <Route path="/categories" element={<Categories />} />
          </Routes>
        </MemoryRouter>
      </Providers>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render 'No Categories Found' when there are no categories", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [],
      },
    });

    const { container } = setup();

    const categoriesDropdown = screen.getByText("Categories");
    fireEvent.click(categoriesDropdown);

    const allCategoriesLink = screen.getByText("All Categories");
    fireEvent.click(allCategoriesLink);

    await waitFor(() => {
      const row = container.querySelector(".row");
      expect(row).toBeInTheDocument();
      expect(row.children.length).toBe(0);
    });
  });

  it("should render categories when they are fetched successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Category 1", slug: "category-1" },
          { _id: "2", name: "Category 2", slug: "category-2" },
        ],
      },
    });

    setup();

    await waitFor(() => {
      expect(screen.getByText("Category 1")).toBeInTheDocument();
      expect(screen.getByText("Category 2")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Category 1" })).toHaveAttribute(
      "href",
      "/category/category-1"
    );
    expect(screen.getByRole("link", { name: "Category 2" })).toHaveAttribute(
      "href",
      "/category/category-2"
    );
  });

  it("should handle API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    const { container } = setup();

    const categoriesDropdown = screen.getByText("Categories");
    fireEvent.click(categoriesDropdown);

    const allCategoriesLink = screen.getByText("All Categories");
    fireEvent.click(allCategoriesLink);

    await waitFor(() => {
      expect(screen.getByText("All Categories")).toBeInTheDocument();
      const row = container.querySelector(".row");
      expect(row).toBeInTheDocument();
      expect(row.children.length).toBe(0);
    });
  });
});
