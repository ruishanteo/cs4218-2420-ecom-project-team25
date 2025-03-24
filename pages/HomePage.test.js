import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "@testing-library/jest-dom";

import HomePage from "./HomePage";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";

// Mock dependencies
jest.mock("axios");
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("../hooks/useCategory", () => jest.fn());

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

Object.defineProperty(window, "location", {
  writable: true,
  value: {
    reload: jest.fn(),
  },
});

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("HomePage Component", () => {
  const perPage = 2;
  const mockedCategories = [
    { _id: "1", name: "Test Category 1", slug: "test-category-1" },
    { _id: "2", name: "Test Category 2", slug: "test-category-2" },
    { _id: "3", name: "Test Category 3", slug: "test-category-3" },
  ];
  const mockedProducts = [
    {
      _id: "1",
      name: "Test Product 1",
      slug: "test-product-1",
      description:
        "This is a test product description that is longer than 60 characters.",
      price: 10.99,
      categories: [mockedCategories[0]],
    },
    {
      _id: "2",
      name: "Test Product 2",
      slug: "test-product-2",
      description:
        "Another test product description that is longer than 60 characters.",
      price: 1149.99,
      categories: [mockedCategories[1]],
    },
    {
      _id: "3",
      name: "Test Product 3",
      slug: "test-product-3",
      description:
        "Another test product description that is longer than 60 characters.",
      price: 10.99,
      categories: [mockedCategories[1]],
    },
    {
      _id: "4",
      name: "Test Product 4",
      slug: "test-product-4",
      description:
        "Another test product description that is longer than 60 characters.",
      price: 1149.99,
      categories: [mockedCategories[2]],
    },
    {
      _id: "5",
      name: "Test Product 5",
      slug: "test-product-5",
      description:
        "Another test product description that is longer than 60 characters.",
      price: 10.99,
      categories: [mockedCategories[1]],
    },
  ];
  const mockedNavigate = jest.fn();
  const mockedSetCart = jest.fn();

  const mockAxiosGet = ({
    noProductsFound = false,
    failProductsFetch = false,
  } = {}) => {
    axios.get.mockImplementation((url, { params }) => {
      if (noProductsFound) {
        return Promise.resolve({ data: { products: [], hasMore: false } });
      }

      if (failProductsFetch) {
        return Promise.reject(new Error("Failed to fetch products"));
      }

      const page = parseInt(params.page || 1, 10);
      const minPrice = parseInt(params.minPrice, 10) || 0;
      const maxPrice = parseInt(params.maxPrice, 10) || Number.MAX_VALUE;
      const categories = params.categories ? params.categories.split(",") : [];

      let filteredProducts = mockedProducts.filter(
        (p) => p.price >= minPrice && p.price <= maxPrice
      );

      if (categories.length > 0) {
        filteredProducts = filteredProducts.filter((p) =>
          p.categories.some((c) => categories.includes(c._id))
        );
      }
      const start = (page - 1) * perPage;
      const end = start + perPage;
      return Promise.resolve({
        data: {
          products: filteredProducts.slice(start, end),
          hasMore: end < filteredProducts.length,
        },
      });
    });
  };

  const setup = async (waitForProucts = true) => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    if (waitForProucts) {
      expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([[], mockedSetCart]);
    useCategory.mockReturnValue([mockedCategories, jest.fn()]);
    useNavigate.mockReturnValue(mockedNavigate);
  });

  test("renders categories after successful fetch", async () => {
    mockAxiosGet();

    await setup(true);

    expect(await screen.findByText("Test Category 1")).toBeInTheDocument();
    expect(screen.getByText("Test Category 2")).toBeInTheDocument();
  });

  test("renders products after successful fetch", async () => {
    mockAxiosGet();

    await setup(true);

    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();
  });

  test("renders No Product Found message when no products are fetched", async () => {
    mockAxiosGet({ noProductsFound: true });

    await act(async () => {
      await setup(false);
    });

    expect(await screen.findByText("No Product Found")).toBeInTheDocument();
  });

  test("displays error message when product fetch fails", async () => {
    mockAxiosGet({ failProductsFetch: true });

    await act(async () => {
      await setup(false);
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Error in getting products")
    );
    expect(await screen.findByText("No Product Found")).toBeInTheDocument();
  });

  test("filters products by category", async () => {
    mockAxiosGet();

    await setup();

    // Click on the category checkbox using the category text
    fireEvent.click(screen.getByText(mockedCategories[0].name));

    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 4")).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: {
        categories: mockedCategories[0]._id,
        maxPrice: 0,
        minPrice: 0,
        page: 1,
      },
    });
  });

  test("filters products by price range", async () => {
    mockAxiosGet();

    await setup();

    // Click on the price range checkbox using the price range text
    fireEvent.click(screen.getByText("$100 or more"));

    expect(await screen.findByText("Test Product 2")).toBeInTheDocument();
    expect(await screen.findByText("Test Product 4")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 3")).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: { categories: "", maxPrice: 9999, minPrice: 100, page: 1 },
    });
  });

  test("filters by category and price range", async () => {
    mockAxiosGet();

    await setup();

    // Click on the category checkbox using the category text
    fireEvent.click(screen.getByText(mockedCategories[1].name));
    // Click on the price range checkbox using the price range text
    fireEvent.click(screen.getByText("$0 to 19"));

    expect(await screen.findByText("Test Product 3")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 4")).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: {
        categories: mockedCategories[1]._id,
        maxPrice: 19,
        minPrice: 0,
        page: 1,
      },
    });
  });

  test("filters by multiple categories", async () => {
    mockAxiosGet();

    await setup();

    // Click on the category checkbox using the category text
    fireEvent.click(screen.getByText(mockedCategories[0].name));
    fireEvent.click(screen.getByText(mockedCategories[2].name));

    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Test Product 4")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 3")).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: {
        categories: `${mockedCategories[0]._id},${mockedCategories[2]._id}`,
        maxPrice: 0,
        minPrice: 0,
        page: 1,
      },
    });
  });

  test("filters by multiple categories and price range", async () => {
    mockAxiosGet();

    await setup();

    // Click on the category checkbox using the category text
    fireEvent.click(screen.getByText(mockedCategories[0].name));
    fireEvent.click(screen.getByText(mockedCategories[2].name));
    // Click on the price range checkbox using the price range text
    fireEvent.click(screen.getByText("$100 or more"));

    expect(await screen.findByText("Test Product 4")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 3")).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: {
        categories: `${mockedCategories[0]._id},${mockedCategories[2]._id}`,
        maxPrice: 9999,
        minPrice: 100,
        page: 1,
      },
    });
  });

  test("filters and unfilters products by category", async () => {
    mockAxiosGet();

    await setup();

    // Click on the category checkbox using the category text
    fireEvent.click(screen.getByText(mockedCategories[0].name));

    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 4")).not.toBeInTheDocument();

    // Click on the category checkbox using the category text to unfilter
    fireEvent.click(screen.getByText(mockedCategories[0].name));

    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Test Product 2")).toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: {
        categories: "",
        maxPrice: 0,
        minPrice: 0,
        page: 1,
      },
    });
  });

  test("load more with no filters applied", async () => {
    mockAxiosGet();

    await setup();
    expect(await screen.findByText("Loadmore")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Loadmore"));

    expect(await screen.findByText("Test Product 3")).toBeInTheDocument();
    expect(await screen.findByText("Loadmore")).toBeInTheDocument(); // still has more
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    expect(screen.getByText("Test Product 4")).toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: {
        categories: "",
        maxPrice: 0,
        minPrice: 0,
        page: 2,
      },
    });
  });

  test("load more with category filter applied", async () => {
    mockAxiosGet();

    await setup();

    // Click on the category checkbox using the category text
    fireEvent.click(screen.getByText(mockedCategories[1].name));
    expect(await screen.findByText("Test Product 2")).toBeInTheDocument();
    expect(await screen.findByText("Test Product 3")).toBeInTheDocument();
    expect(await screen.findByText("Loadmore")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();

    // Load more
    fireEvent.click(screen.getByText("Loadmore"));

    expect(await screen.findByText("Test Product 5")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    expect(screen.getByText("Test Product 3")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Loadmore")).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: {
        categories: mockedCategories[1]._id,
        maxPrice: 0,
        minPrice: 0,
        page: 2,
      },
    });
  });

  test("load more with price range filter applied", async () => {
    mockAxiosGet();

    await setup();

    // Click on the price range checkbox using the price range text
    fireEvent.click(screen.getByText("$0 to 19"));
    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Test Product 3")).toBeInTheDocument();
    expect(await screen.findByText("Loadmore")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();

    // Load more
    fireEvent.click(screen.getByText("Loadmore"));

    expect(await screen.findByText("Test Product 5")).toBeInTheDocument();
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 3")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Loadmore")).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith("/api/v1/product/product-list", {
      params: {
        categories: "",
        maxPrice: 19,
        minPrice: 0,
        page: 2,
      },
    });
  });

  test("displays error message when load more fails", async () => {
    mockAxiosGet();

    await setup();

    // Click on the price range checkbox using the price range text
    fireEvent.click(screen.getByText("$0 to 19"));
    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Test Product 3")).toBeInTheDocument();
    expect(await screen.findByText("Loadmore")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();

    // Load more
    mockAxiosGet({ failProductsFetch: true });
    fireEvent.click(screen.getByText("Loadmore"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Error in getting more products")
    );
    expect(screen.queryByText("Test Product 5")).not.toBeInTheDocument();
  });

  test("reset filters", async () => {
    mockAxiosGet();

    await setup();

    // Click on the category checkbox using the category text
    fireEvent.click(screen.getByText(mockedCategories[0].name));
    // Click on the price range checkbox using the price range text
    fireEvent.click(screen.getByText("$0 to 19"));

    expect(await screen.findByText("Test Product 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Product 4")).not.toBeInTheDocument();

    // Click on the reset button
    fireEvent.click(screen.getByText(/reset filters/i));

    expect(window.location.reload).toHaveBeenCalled();
  });

  test("add to cart", async () => {
    mockAxiosGet();

    await setup();

    // find and click the first add to cart button
    const addToCartButtons = screen.getAllByText(/add to cart/i);
    fireEvent.click(addToCartButtons[0]);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Item Added to cart")
    );
    expect(mockedSetCart).toHaveBeenCalledWith([mockedProducts[0]]);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([mockedProducts[0]])
    );
  });

  test("navigate to product details", async () => {
    mockAxiosGet();

    await setup();

    // find and click the first more details button
    const moreDetailsButtons = screen.getAllByText(/more details/i);
    fireEvent.click(moreDetailsButtons[0]);

    expect(mockedNavigate).toHaveBeenCalledWith(`/product/${mockedProducts[0].slug}`);
  });
});
