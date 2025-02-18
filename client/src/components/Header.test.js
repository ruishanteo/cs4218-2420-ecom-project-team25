import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import Header from "./Header";
import toast from "react-hot-toast";
import "@testing-library/jest-dom";
import useCategory from "../hooks/useCategory";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => ["", jest.fn()]),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => [[], jest.fn()]),
}));

describe("Header Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([
      [
        {
          _id: "123451",
          name: "Electronics",
          slug: "electronics",
          __v: 0,
        },
        {
          _id: "123452",
          name: "Fashion",
          slug: "fashion",
          __v: 0,
        },
      ],
      jest.fn(),
    ]);
  });

  beforeAll(() => {
    // Mock the localStorage methods
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it("renders header with categories", () => {
    // Mock the useAuth hook to return a logged-out state
    useAuth.mockReturnValue([null, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("🛒 Virtual Vault")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("All Categories")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Fashion")).toBeInTheDocument();
  });

  it("displays login and register links when the user is not authenticated", () => {
    // Mock the useAuth hook to return a logged-out state
    useAuth.mockReturnValue([null, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("displays user dropdown and logout option when the user is authenticated", () => {
    const setAuthMock = jest.fn();
    const user = { name: "John Doe" };
    // Mock the useAuth hook to return an authenticated state
    useAuth.mockReturnValue([{ user }, setAuthMock]);
    useCart.mockReturnValue([[], jest.fn()]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Check if the user's name appears in the header
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls handleLogout when logout is clicked", async () => {
    const setAuthMock = jest.fn();
    const user = { name: "John Doe" };

    // Mock the useAuth hook to return an authenticated state
    useAuth.mockReturnValue([{ user }, setAuthMock]);
    useCart.mockReturnValue([[], jest.fn()]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("John Doe"));
    // Click on the logout link
    fireEvent.click(screen.getByText("Logout"));

    // Check if setAuth was called to clear the user
    await waitFor(() =>
      expect(setAuthMock).toHaveBeenCalledWith({
        user: null,
        token: "",
      })
    );

    expect(localStorage.removeItem).toHaveBeenCalledWith("auth");
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });

  it("redirects to the correct dashboard based on user role", () => {
    const userAdmin = { name: "Admin User", role: 1 };
    const userRegular = { name: "Regular User", role: 0 };

    // Test for admin role
    useAuth.mockReturnValue([{ user: userAdmin }, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("Admin User")).toBeInTheDocument();

    // Test for regular user
    useAuth.mockReturnValue([{ user: userRegular }, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("Regular User")).toBeInTheDocument();
  });

  it("displays cart count correctly", () => {
    // Mock the useAuth hook to return a logged-out state
    useAuth.mockReturnValue([null, jest.fn()]);
    useCart.mockReturnValue([[{ id: 1 }, { id: 2 }], jest.fn()]); // Cart with 2 items

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Check if the cart badge shows the correct count
    expect(screen.getByText("Cart")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Cart count is 2
  });

  it("displays empty cart count correctly", () => {
    // Mock the useAuth hook to return a logged-out state
    useAuth.mockReturnValue([null, jest.fn()]);
    useCart.mockReturnValue([[], jest.fn()]); // Empty cart

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Check if the cart badge shows the correct count (0 in this case)
    expect(screen.getByText("Cart")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // Cart count is 0
  });
});
