import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import CategoryProduct from "./CategoryProduct";

import axios from "axios";
import {
  useParams,
  useNavigate,
  MemoryRouter,
  Routes,
  Route,
} from "react-router-dom";

jest.mock("axios");

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

describe("Category Product Page", () => {
  let consoleLogSpy;

  const mockProducts = [
    {
      _id: "1",
      name: "Test Product 1",
      slug: "test-product-1",
      description:
        "This is a test product description that is longer than 60 characters to test substring",
      price: 99.99,
    },
    {
      _id: "2",
      name: "Test Product 2",
      slug: "test-product-2",
      description:
        "Another test product description that is longer than 60 characters to test substring",
      price: 149.99,
    },
  ];

  const mockCategory = {
    name: "Test Category",
  };

  const mockSlug = "test-category";

  const mockedNavigator = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output
    useNavigate.mockReturnValue(mockedNavigator);
    useParams.mockReturnValue({ slug: mockSlug });
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should render products in Category Product page", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: mockProducts,
        category: mockCategory,
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/:slug"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(`Category - ${mockCategory.name}`)
      ).toBeInTheDocument();
    });

    mockProducts.forEach((product) => {
      const productName = screen.getByText(product.name);
      expect(productName).toBeInTheDocument();

      const productImage = screen.getByAltText(product.name);
      expect(productImage).toBeInTheDocument();
      expect(productImage).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${product._id}`
      );
    });

    // number of more details button
    const moreDetailsButton = screen.getAllByText("More Details");
    expect(moreDetailsButton.length).toBe(mockProducts.length);
  });

  it("should log error if failed to fetch products", async () => {
    const mockError = new Error("Failed to fetch products");
    axios.get = jest.fn().mockRejectedValueOnce(mockError);

    render(
      <MemoryRouter initialEntries={["/category/test-category"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/product-category/${mockSlug}`
      );
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });

  it("should fetch products of category if slug exists", async () => {
    render(
      <MemoryRouter initialEntries={["/category/test-category"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/product-category/${mockSlug}`
      );
    });
  });

  it("should not fetch products if slug does not exist", async () => {
    useParams.mockReturnValueOnce({ slug: "" });

    render(
      <MemoryRouter initialEntries={["/category"]}>
        <Routes>
          <Route path="/category" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  it("should navigate to the product page on click", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [mockProducts[0]],
        category: mockCategory,
      },
    });

    render(
      <MemoryRouter initialEntries={["/category/test-category"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(`Category - ${mockCategory.name}`)
      ).toBeInTheDocument();
    });

    const moreDetailsButton = screen.getAllByText(/More Details/i)[0];

    console.log("Clicking button:", moreDetailsButton);

    fireEvent.click(moreDetailsButton);

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith(
        `/product/${mockProducts[0].slug}`
      );
    });
  });
});
