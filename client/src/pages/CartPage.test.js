import React from "react";
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import axios from "axios";
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

jest.mock("braintree-web-drop-in-react", () => ({
  __esModule: true,
  default: ({ onInstance }) => {
    const mockInstance = {
      requestPaymentMethod: () => Promise.resolve({ nonce: "fake-nonce-123" }),
    };

    // Call onInstance immediately
    onInstance(mockInstance);

    return <div data-testid="dropin-container">Mock DropIn</div>;
  },
}));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// ensure react router context is available
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const mockCartItems = [
  {
    _id: "1",
    name: "Product 1",
    price: 100,
    quantity: 2,
    image: "product1.jpg",
    description: "This is a product description",
  },
  {
    _id: "2",
    name: "Product 2",
    price: 200,
    quantity: 1,
    image: "product2.jpg",
    description: "This is a product description",
  },
];
const mockUser = {
  name: "John Doe",
  email: "john@gmail.com",
  address: "NUS, Singapore",
  phone: "1234567890",
};

const mockToken = "mockToken";

describe("Cart Page when user is authenticated", () => {
  useCart.mockReturnValue([mockCartItems, jest.fn()]);

  // mock useauth

  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    useCart.mockReturnValue([mockCartItems, jest.fn()]);
    useAuth.mockReturnValue([{ user: mockUser, token: mockToken }, jest.fn()]);
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should render Cart page", () => {
    renderWithRouter(<CartPage />);

    expect(screen.getByText("Cart Summary")).toBeInTheDocument();
    const updateButton = screen.getByRole("button", { name: "Update Address" });
    expect(updateButton).toBeInTheDocument();
  });

  it("should display user's details", () => {
    renderWithRouter(<CartPage />);

    expect(screen.getByText(`Hello ${mockUser.name}`)).toBeInTheDocument();
    expect(screen.getByText(mockUser.address)).toBeInTheDocument();
  });

  it("should display correct number of cart items", () => {
    renderWithRouter(<CartPage />);

    // check number of items
    expect(
      screen.getByText(`You have ${mockCartItems.length} items in your cart`)
    ).toBeInTheDocument();

    // check product images
    mockCartItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      // cart image
      const productImage = screen.getByAltText(item.name); // Find by alt text
      expect(productImage).toBeInTheDocument();
      expect(productImage).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${item._id}`
      );
    });

    // check remove buttons
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(mockCartItems.length);
  });

  it("should calculate total price correctly", () => {
    renderWithRouter(<CartPage />);
    const mockTotal = mockCartItems.reduce((acc, item) => acc + item.price, 0);
    expect(screen.getByText(`Total : $${mockTotal}.00`)).toBeInTheDocument();
  });
});

describe("Cart Page when user is not authenticated", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    useCart.mockReturnValue([mockCartItems, jest.fn()]);
    useAuth.mockReturnValue([{ user: null, token: null }, jest.fn()]);

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should render login button", () => {
    renderWithRouter(<CartPage />);

    const loginButton = screen.getByRole("button", {
      name: "Please login to checkout",
    });
    expect(loginButton).toBeInTheDocument();
  });
});
describe("Cart Page, getToken", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should get client token", async () => {
    const mockResponse = {
      data: {
        clientToken: "mockClientToken",
      },
    };
    axios.get = jest.fn().mockResolvedValueOnce(mockResponse);

    renderWithRouter(<CartPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
  });

  it("should log error if error is thrown while getting client token", async () => {
    const mockError = new Error("Failed to get client token");
    axios.get = jest.fn().mockRejectedValueOnce(mockError);

    renderWithRouter(<CartPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });
});

describe("Cart Page, removeCartItem", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should remove correct item from cart when remove button is clicked", () => {
    const setCart = jest.fn();

    useCart.mockReturnValue([mockCartItems, setCart]);

    const productToRemove = mockCartItems[0];

    renderWithRouter(<CartPage />);
    const removeButton = screen.getAllByRole("button", { name: "Remove" })[0];
    fireEvent.click(removeButton);

    const expectedCart = mockCartItems.filter(
      (item) => item._id !== productToRemove._id
    );
    expect(setCart).toHaveBeenCalledWith(expectedCart);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify(expectedCart)
    );
  });

  it("should not remove item from cart if error occurs", () => {
    const setCart = jest.fn();

    useCart.mockReturnValue([mockCartItems, setCart]);

    setCart.mockImplementationOnce(() => {
      throw new Error("Failed to remove item");
    });

    renderWithRouter(<CartPage />);
    const removeButton = screen.getAllByRole("button", { name: "Remove" })[0];
    fireEvent.click(removeButton);

    expect(setCart).toHaveBeenCalledTimes(1);
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});

describe("Cart Page, totalPrice", () => {
  const setCart = jest.fn();

  useCart.mockReturnValue([mockCartItems, setCart]);

  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // mock console.log to suppress output
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should calculate total price correctly", () => {
    renderWithRouter(<CartPage />);
    const mockTotal = mockCartItems.reduce((acc, item) => acc + item.price, 0);
    expect(screen.getByText(`Total : $${mockTotal}.00`)).toBeInTheDocument();
  });

  it("should log error if error occurs while calculating total price", () => {
    // mock toLocaleString to throw an error
    const mockToLocaleString = jest.spyOn(Number.prototype, "toLocaleString");
    mockToLocaleString.mockImplementation(() => {
      throw new Error("toLocaleString failed");
    });

    renderWithRouter(<CartPage />);

    // Verify console.log was called with the error
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(consoleLogSpy.mock.calls[0][0].message).toBe(
      "toLocaleString failed"
    );
  });
});

describe("CartPage Payment", () => {
  beforeEach(() => {
    // Setup default mocks

    // Reset all mocks
    jest.clearAllMocks();
  });

  xtest("handles successful payment", async () => {
    // Mock auth context
    useAuth.mockReturnValue([{ user: mockUser, token: mockToken }, jest.fn()]);
    // Mock cart items
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    const mockResponse = {
      data: {
        clientToken: "mockClientToken",
      },
    };
    axios.get = jest.fn().mockResolvedValueOnce(mockResponse);
    axios.post.mockResolvedValue({ data: { success: true } });

    renderWithRouter(<CartPage />);

    // Wait for the payment button to be enabled

    // Click the payment button
    // fireEvent.click(paymentButton);

    // Verify the expected behavior
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    await waitFor(() => {
      expect(screen.getByTestId("dropin-container")).toBeInTheDocument();
    });

    // Check if localStorage was cleared

    const paymentButton = screen.getByRole("button", { name: "Make Payment" });
    expect(
      screen.getByRole("button", { name: "Make Payment" })
    ).toBeInTheDocument();

    fireEvent.click(paymentButton);

    console.log("handle payment");
    // await waitFor(() => {
    //   expect(axios.post).toHaveBeenCalledWith(
    //     "/api/v1/product/braintree/payment",
    //     {
    //       nonce: "fake-nonce-123",
    //       cart: mockCartItems,
    //     }
    //   );
    // });
  });
});
