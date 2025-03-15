import React from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Routes, Route, MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import AdminOrders, {
  ADMIN_ORDERS_STRINGS,
  API_URLS,
} from "../../../../pages/admin/AdminOrders";
import { API_URLS as CATEGORY_API_URLS } from "../../../../hooks/useCategory";
import { AuthProvider } from "../../../../context/auth";
import { CartProvider } from "../../../../context/cart";
import { SearchProvider } from "../../../../context/search";

jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

jest.mock("axios");

jest.mock("antd", () => {
  const MockSelect = ({
    children,
    onChange,
    defaultValue,
    value,
    "aria-label": ariaLabel,
  }) => (
    <select
      defaultValue={defaultValue}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    >
      {children}
    </select>
  );
  MockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  const MockBadge = ({ children }) => <div>{children}</div>;
  return { Select: MockSelect, Badge: MockBadge };
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

const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("AdminOrders Integration Tests", () => {
  const mockAuthData = { user: { name: "Admin User" }, token: "valid-token" };
  const mockCategories = [
    { _id: "1", name: "Category1" },
    { _id: "2", name: "Category2" },
  ];
  const mockOrders = [
    {
      _id: "1",
      status: "Processing",
      buyer: { name: "John Doe" },
      products: [
        { _id: "p1", name: "Product 1", description: "Desc 1", price: 100 },
      ],
      createAt: new Date().toISOString(),
      payment: { success: true },
    },
    {
      _id: "2",
      status: "Not Process",
      buyer: { name: "Jane Doe" },
      products: [
        { _id: "p2", name: "Product 2", description: "Desc 2", price: 200 },
      ],
      createAt: new Date().toISOString(),
      payment: { success: false },
    },
  ];

  const setAuthInLocalStorage = (authData) => {
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  const clearAuthFromLocalStorage = () => {
    localStorage.removeItem("auth");
  };

  const setup = () => {
    return render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/admin/orders"]}>
          <Routes>
            <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
          </Routes>
        </MemoryRouter>
      </Providers>
    );
  };

  const mockAxiosGet = ({
    failOrdersFetch = false,
    unsuccessfulOrdersFetch = false,
  } = {}) => {
    axios.get.mockImplementation((url) => {
      if (url === CATEGORY_API_URLS.GET_CATEGORIES) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url === API_URLS.GET_ALL_ORDERS) {
        if (failOrdersFetch) {
          return Promise.reject(new Error("Failed"));
        }

        if (unsuccessfulOrdersFetch) {
          return Promise.resolve({ data: { success: false } });
        }

        return Promise.resolve({ data: mockOrders });
      }
      return Promise.reject(new Error("Not Found"));
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should display orders when authenticated", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

    setup();

    await waitFor(() =>
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length)
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
  });

  it("should not fetch orders when unauthenticated", async () => {
    clearAuthFromLocalStorage();
    mockAxiosGet();

    setup();

    await waitFor(() =>
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    );
    expect(axios.get).not.toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
  });

  it("should show error on failed orders fetch", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet({ failOrdersFetch: true });

    setup();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.FETCH_ORDERS_ERROR
      )
    );
  });

  it("should update order status successfully", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    setup();
    await waitFor(() =>
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length)
    );

    const select = screen.getByDisplayValue(mockOrders[0].status);
    fireEvent.change(select, { target: { value: "Shipped" } });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.UPDATE_STATUS_SUCCESS
      );
    });
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_ORDER_STATUS}/${mockOrders[0]._id}`,
      { status: "Shipped" }
    );
    expect(
      axios.get.mock.calls.filter(([url]) => url === API_URLS.GET_ALL_ORDERS)
    ).toHaveLength(2); // Re-fetch orders after update
  });

  it("should show error on failed order status update (rejected request)", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();
    axios.put.mockRejectedValueOnce(new Error("Failed"));

    setup();
    await waitFor(() =>
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length)
    );

    const select = screen.getByDisplayValue(mockOrders[0].status);
    fireEvent.change(select, { target: { value: "Shipped" } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.UPDATE_STATUS_ERROR
      );
    });
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_ORDER_STATUS}/${mockOrders[0]._id}`,
      { status: "Shipped" }
    );
    expect(
      axios.get.mock.calls.filter(([url]) => url === API_URLS.GET_ALL_ORDERS)
    ).toHaveLength(1); // Should NOT re-fetch orders
  });

  it("should handle unsuccessful order fetch response (success: false)", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet({ unsuccessfulOrdersFetch: true });

    setup();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.FETCH_ORDERS_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
  });

  it("should handle unsuccessful status update response (success: false)", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();
    axios.put.mockResolvedValueOnce({ data: { success: false } });

    setup();
    await waitFor(() =>
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length)
    );

    const select = screen.getByDisplayValue(mockOrders[0].status);
    fireEvent.change(select, { target: { value: "Shipped" } });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.UPDATE_STATUS_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_ORDER_STATUS}/${mockOrders[0]._id}`,
      { status: "Shipped" }
    );
  });
});
