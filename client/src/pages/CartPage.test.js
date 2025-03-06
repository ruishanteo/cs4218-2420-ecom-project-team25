import React from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
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
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("braintree-web-drop-in-react", () => {
  return function DropIn(props) {
    return (
      <div data-testid="mock-dropin">
        <button
          onClick={() =>
            props.onInstance({
              requestPaymentMethod: async () => ({ nonce: "fake-nonce" }),
            })
          }
        >
          DropIn mock
        </button>
      </div>
    );
  };
});

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

// 1 item -> bva to test for smallest non empty cart
const mockCartItems = [
  {
    _id: "1",
    name: "Product 1",
    price: 100,
    quantity: 2,
    image: "product1.jpg",
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
  const mockedNavigator = jest.fn();
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([mockCartItems, jest.fn()]); // cart is not empty
    useAuth.mockReturnValue([{ user: mockUser, token: mockToken }, jest.fn()]); // user is authenticated
    useNavigate.mockReturnValue(mockedNavigator);
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should render Cart page with user details", () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByText("Cart Summary")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update Address" })
    ).toBeInTheDocument();
    expect(screen.getByText(`Hello ${mockUser.name}`)).toBeInTheDocument();
    expect(screen.getByText(mockUser.address)).toBeInTheDocument();
  });

  it("should display correct number of cart items", () => {
    renderWithRouter(<CartPage />);

    mockCartItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      const productImage = screen.getByAltText(item.name);
      expect(productImage).toBeInTheDocument();
    });

    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(
      mockCartItems.length
    );

    expect(screen.getByTestId("total-price-header")).toHaveTextContent(
      `${mockCartItems[0].price}`
    );
  });

  it("should display correct number of cart items for more than 1 item", () => {
    // tests the sum logic for total price
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
        description: "This is another product description",
      },
    ];
    useCart.mockReturnValue([mockCartItems, jest.fn()]);

    renderWithRouter(<CartPage />);

    mockCartItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      const productImage = screen.getByAltText(item.name);
      expect(productImage).toBeInTheDocument();
    });

    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(
      mockCartItems.length
    );

    const mockTotal = mockCartItems.reduce((acc, item) => acc + item.price, 0);
    expect(screen.getByTestId("total-price-header")).toHaveTextContent(
      `${mockTotal}`
    );
  });

  it("should display empty cart if cart is empty", () => {
    useCart.mockReturnValue([[], jest.fn()]);
    renderWithRouter(<CartPage />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByTestId("total-price-header")).toHaveTextContent(`0.00`);
  });

  it("should handle total price calcuation error gracefully", () => {
    const mockError = new Error("Failed to calculate total price");
    const mockToLocaleString = jest.spyOn(Number.prototype, "toLocaleString");
    mockToLocaleString.mockImplementation(() => {
      throw mockError;
    });

    renderWithRouter(<CartPage />);
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });

  it("should navigate to update address page when update address button is clicked", () => {
    renderWithRouter(<CartPage />);
    fireEvent.click(screen.getByRole("button", { name: "Update Address" }));
    expect(mockedNavigator).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  it("should display update address button if user does not have an address", () => {
    useAuth.mockReturnValue([
      { user: { ...mockUser, address: "" }, token: mockToken },
      jest.fn(),
    ]);
    renderWithRouter(<CartPage />);
    const updateButton = screen.getByRole("button", { name: "Update Address" });
    expect(updateButton).toBeInTheDocument();
    fireEvent.click(updateButton);
    expect(mockedNavigator).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  it("should remove correct item from cart when remove button is clicked", () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([mockCartItems, setCart]);
    const idxProductToRemove = 0;
    const productToRemove = mockCartItems[idxProductToRemove];

    renderWithRouter(<CartPage />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Remove" })[idxProductToRemove]
    );

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
    const setCart = jest.fn().mockImplementationOnce(() => {
      throw new Error("Failed to remove item");
    });
    useCart.mockReturnValue([mockCartItems, setCart]);

    renderWithRouter(<CartPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(setCart).toHaveBeenCalledTimes(1);
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should not render payment gateway", () => {
    renderWithRouter(<CartPage />);
    expect(screen.queryByTestId("mock-dropin")).not.toBeInTheDocument();
  });
});

describe("Cart Page when user is not authenticated", () => {
  let consoleLogSpy;
  const mockedNavigator = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([mockCartItems, jest.fn()]);
    useAuth.mockReturnValue([{ user: null, token: null }, jest.fn()]); // user is not authenticated
    useNavigate.mockReturnValue(mockedNavigator);
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
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
    fireEvent.click(loginButton);
    expect(mockedNavigator).toHaveBeenCalledWith("/login", { state: "/cart" });
  });
});

describe("Cart page token retrieval", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should get client token", async () => {
    axios.get = jest
      .fn()
      .mockResolvedValueOnce({ data: { clientToken: "mockClientToken" } });
    renderWithRouter(<CartPage />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
  });

  it("handle error gracefully when getting client token", async () => {
    const mockError = new Error("Failed to get client token");
    axios.get = jest.fn().mockRejectedValueOnce(mockError);
    renderWithRouter(<CartPage />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });
});

describe("CartPage checkout process", () => {
  let consoleLogSpy;
  const mockedNavigator = jest.fn();
  const mockSetCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    useNavigate.mockReturnValue(mockedNavigator);
    useAuth.mockReturnValue([{ user: mockUser, token: mockToken }, jest.fn()]);
    useCart.mockReturnValue([mockCartItems, mockSetCart]);
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("should handle payment successfully", async () => {
    axios.get = jest
      .fn()
      .mockResolvedValueOnce({ data: { clientToken: "mockClientToken" } });
    axios.post = jest.fn().mockResolvedValue({ data: { success: true } });

    renderWithRouter(<CartPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
    const dropIn = await screen.findByTestId("mock-dropin");
    expect(dropIn).toBeInTheDocument();

    // simulate user clicking on the drop-in button
    fireEvent.click(await screen.findByText("DropIn mock"));

    const paymentButton = await screen.findByRole("button", {
      name: /make payment/i,
    });
    expect(paymentButton).toBeEnabled();

    // simulate user clicking on the payment button
    fireEvent.click(paymentButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        {
          nonce: "fake-nonce",
          cart: mockCartItems,
        }
      );
    });

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith("cart");
    });
    expect(mockSetCart).toHaveBeenCalledWith([]);
    expect(mockedNavigator).toHaveBeenCalledWith("/dashboard/user/orders");
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/Payment Completed Successfully/i)
    );
  });

  it("should handle payment error gracefully", async () => {
    const mockError = new Error("Payment failed");
    axios.get = jest
      .fn()
      .mockResolvedValueOnce({ data: { clientToken: "mockClientToken" } });
    axios.post = jest.fn().mockRejectedValueOnce(mockError);

    renderWithRouter(<CartPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    const dropIn = await screen.findByTestId("mock-dropin");
    expect(dropIn).toBeInTheDocument();

    // simulate user clicking on the drop-in button
    fireEvent.click(await screen.findByText("DropIn mock"));

    const paymentButton = await screen.findByRole("button", {
      name: /make payment/i,
    });
    expect(paymentButton).toBeEnabled();

    // simulate user clicking on the payment button
    fireEvent.click(paymentButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        {
          nonce: "fake-nonce",
          cart: mockCartItems,
        }
      );
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    expect(toast.success).not.toHaveBeenCalled();
  });
});
