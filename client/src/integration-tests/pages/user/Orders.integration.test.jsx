import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import Orders from "../../../pages/user/Orders";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import PrivateRoute from "../../../components/Routes/Private";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

Object.defineProperty(window, "matchMedia", {
  value: jest.fn(() => {
    return {
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  }),
});

const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("Orders Integration Tests", () => {
  const mockUser = {
    name: "John Doe",
    email: "john@gmail.com",
    address: "NUS, Singapore",
  };

  const mockToken = "mock-token";

  const mockOrders = [
    {
      _id: "1",
      status: "Processing",
      buyer: { name: "John Doe" },
      createAt: "2023-10-01T00:00:00.000Z",
      payment: { success: true },
      products: [
        {
          _id: "p1",
          name: "Product 1",
          description: "Description of Product 1",
          price: 100,
        },
        {
          _id: "p2",
          name: "Product 2",
          description: "Description of Product 2",
          price: 200,
        },
      ],
    },
    {
      _id: "2",
      status: "Shipped",
      buyer: { name: "John Doe" },
      createAt: "2023-09-01T00:00:00.000Z",
      payment: { success: true },
      products: [
        {
          _id: "p3",
          name: "Product 3",
          description: "Description of Product 3",
          price: 100,
        },
      ],
    },
  ];

  const setup = () => {
    return render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route path="user/orders" element={<Orders />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Providers>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem(
      "auth",
      JSON.stringify({ user: mockUser, token: mockToken })
    );

    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/auth/user-auth": // mock auth check in private route
          return Promise.resolve({ data: { ok: true } });
        case "/api/v1/order/orders":
          return Promise.resolve({ data: mockOrders });
        default:
          return Promise.reject(new Error("Internal Server Error"));
      }
    });
  });

  it("should render the right layout", async () => {
    setup();
    await waitFor(() => {
      expect(document.title).toBe("Your Orders");
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "John Doe" })
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });
  });

  it("should fetch and display orders and their products if user is authenticated", async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    // order 1
    await waitFor(() => {
      expect(screen.getByText("Processing")).toBeInTheDocument();
    });
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();

    // order 2
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Product 3")).toBeInTheDocument();
  });

  it("should redirect user to login page if user is not signed in", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/user-auth") {
        return Promise.resolve({ data: { ok: false } }); // simulate user not signed in in privateroute
      }
    });

    setup();

    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Product 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Shipped")).not.toBeInTheDocument();
    expect(screen.queryByText("Product 3")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /redirecting to you in/i })
      ).toBeInTheDocument();
    });
  });

  it("should handle gracefully when error is thrown when calling API", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/user-auth") {
        return Promise.resolve({ data: { ok: true } });
      }
      if (url === "/api/v1/order/orders") {
        return Promise.reject(new Error("Internal Server Error")); // simulate error when fetching
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    setup();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong while fetching orders"
      );
    });
  });
});
