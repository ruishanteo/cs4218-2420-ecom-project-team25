import {
  BrowserRouter,
  MemoryRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { act } from "react-dom/test-utils";
import axios from "axios";
import ProductDetails from "./ProductDetails";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
jest.mock("axios");
jest.mock("react-hot-toast");

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

describe("Product Details Page", () => {
  const mockSlug = "mock-product";
  const mockProduct = {
    _id: "1",
    name: "Test Product 1",
    slug: "test-product-1",
    description:
      "This is a test product description that is longer than 60 characters to test substring",
    price: 99.99,
    category: {
      _id: "1",
      name: "Test Category",
    },
  };

  const mockRelatedProducts = [
    {
      _id: "2",
      name: "Test Product 2",
      slug: "test-product-2",
      description:
        "Another test product description that is longer than 60 characters to test substring",
      price: 149.99,
    },
  ];

  let consoleLogSpy;

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

  let navigate;
  beforeEach(() => {
    navigate = jest.fn();
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: mockSlug });
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    useNavigate.mockReturnValue(navigate);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should display product details and related products", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } }) // First API call for product data
      .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // Second API call for related products

    // without act, a warning of not wrapping in act will be thrown...
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      )
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`
      )
    );

    expect(await screen.findByText(/Product Details/i)).toBeInTheDocument();
    expect(
      await screen.findByText(new RegExp(`${mockProduct.name}`, "i"))
    ).toBeInTheDocument();
    expect(
      await screen.findByText(new RegExp(`${mockProduct.description}`, "i"))
    ).toBeInTheDocument();

    // verify related products section
    expect(await screen.findByText(/Similar Products/)).toBeInTheDocument();

    // check if all related products are displayed
    for (const product of mockRelatedProducts) {
      expect(await screen.findByText(product.name)).toBeInTheDocument();
      const productImage = await screen.findByAltText(product.name);
      expect(productImage).toBeInTheDocument();
    }
  });

  it("should display message if no related products are found", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } }) // First API call for product data
      .mockResolvedValueOnce({ data: { products: [] } }); // no related products

    // without act, a warning of not wrapping in act will be thrown...
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      )
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`
      )
    );

    expect(await screen.findByText(/Product Details/i)).toBeInTheDocument();

    expect(
      await screen.findByText(/No similar products found/i)
    ).toBeInTheDocument();
  });

  it("should log error if product fetch fails", async () => {
    const mockError = new Error("Failed to fetch product");
    axios.get = jest.fn().mockRejectedValueOnce(mockError);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      );
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });

  it("should log error if related products fetch fails", async () => {
    const mockError = new Error("Failed to fetch related products");
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } }) // First call for product data
      .mockRejectedValueOnce(mockError); // Second call for related products

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`
      );
    });

    // wait for the console log call with the expected error
    await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(mockError));
  });

  it("should add product to cart on click", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } }) // First API call for product data
      .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // Second API call for related products

    const setCart = jest.fn();

    // Mock an empty cart first
    useCart.mockReturnValue([[], setCart]);

    let mockNewUpdatedCart = [mockProduct];

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`
      );
    });
    // add main product to cart
    const addToCartButton = screen.getByTestId(
      `${mockProduct._id}-add-to-cart-btn`
    );
    expect(addToCartButton).toBeInTheDocument();
    fireEvent.click(addToCartButton);

    // ensure the cart is updated with the new product
    expect(setCart).toHaveBeenCalledWith(mockNewUpdatedCart);

    // verify that the local storage is updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify(mockNewUpdatedCart)
    );

    // check toast
    expect(toast.success).toHaveBeenCalled();
  });

  it("should add related product to cart on click", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } }) // First API call for product data
      .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // Second API call for related products

    const setCart = jest.fn();

    // Mock an empty cart first
    useCart.mockReturnValue([[], setCart]);

    const idxRelatedProductToAdd = 0;

    let mockNewUpdatedCart = [mockRelatedProducts[idxRelatedProductToAdd]];

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`
      );
    });

    // add main product to cart
    const addToCartButton = screen.getByTestId(
      `${mockRelatedProducts[idxRelatedProductToAdd]._id}-add-to-cart-btn`
    );
    expect(addToCartButton).toBeInTheDocument();
    fireEvent.click(addToCartButton);

    // ensure the cart is updated with the new product
    expect(setCart).toHaveBeenCalledWith(mockNewUpdatedCart);

    // verify that the local storage is updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify(mockNewUpdatedCart)
    );

    // check toast
    expect(toast.success).toHaveBeenCalled();
  });

  it("should navigate to the correct product page on click", async () => {
    const idxMockRelatedProduct = 0;

    axios.get
      .mockResolvedValueOnce({ data: { product: mockProduct } }) // First call for product data
      .mockResolvedValueOnce({ data: { products: mockRelatedProducts } }); // Second call for related products

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${mockSlug}`
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`
      );
    });

    const moreDetailsButtons = screen.getByTestId(
      `${mockRelatedProducts[idxMockRelatedProduct]._id}-more-details-btn`
    );

    fireEvent.click(moreDetailsButtons);

    expect(navigate).toHaveBeenCalledWith(
      `/product/${mockRelatedProducts[idxMockRelatedProduct].slug}`
    );
  });

  it("should not fetch product if slug doesnt exist", async () => {
    useParams.mockReturnValue({ slug: "" });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/product/mock-product"]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
