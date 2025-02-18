import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import CategoryProduct from "./CategoryProduct";
import toast from "react-hot-toast";

import axios from "axios";
import {
  useParams,
  useNavigate,
  MemoryRouter,
  Routes,
  Route,
} from "react-router-dom";
import { useCart } from "../context/cart";

jest.mock("react-hot-toast");
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

  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    Object.defineProperty(window, "matchMedia", {
      value: jest.fn(() => {
        return {
          matches: true,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        };
      }),
    });
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
        screen.getByText(new RegExp(`Category - ${mockCategory.name}`, "i"))
      ).toBeInTheDocument();
    });

    mockProducts.forEach((product) => {
      const productName = screen.getByText(product.name);
      expect(productName).toBeInTheDocument();

      const productImage = screen.getByAltText(product.name);
      expect(productImage).toBeInTheDocument();
    });

    // number of more details button
    const moreDetailsButton = screen.getAllByText(/More Details/i);
    expect(moreDetailsButton.length).toBe(mockProducts.length);
  });

  it("should render no products in Category Product page", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [],
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
        screen.getByText(new RegExp(`Category - ${mockCategory.name}`, "i"))
      ).toBeInTheDocument();
    });

    const noProduct = screen.queryByRole("img");
    expect(noProduct).not.toBeInTheDocument();
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
        screen.getByText(new RegExp(`Category - ${mockCategory.name}`, "i"))
      ).toBeInTheDocument();
    });

    const moreDetailsButton = screen.getAllByText(/More Details/i)[0];

    fireEvent.click(moreDetailsButton);

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith(
        `/product/${mockProducts[0].slug}`
      );
    });
  });

  it("should add product to cart on click", async () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([[], setCart]);

    const idxProductToAdd = 0;

    axios.get.mockResolvedValueOnce({
      data: {
        products: mockProducts,
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
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/product-category/${mockSlug}`
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`Category - ${mockCategory.name}`, "i"))
      ).toBeInTheDocument();
    });

    const addToCartButton = screen.getByTestId(
      `${mockProducts[idxProductToAdd]._id}-add-to-cart-btn`
    );

    console.log(addToCartButton);

    fireEvent.click(addToCartButton);

    expect(setCart).toHaveBeenCalledWith([mockProducts[idxProductToAdd]]);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify([mockProducts[idxProductToAdd]])
      );
    });

    expect(toast.success).toHaveBeenCalled();
  });
});
