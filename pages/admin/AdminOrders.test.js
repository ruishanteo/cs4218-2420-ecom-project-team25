import React from "react";
import toast from "react-hot-toast";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import AdminOrders, { ADMIN_ORDERS_STRINGS, API_URLS } from "./AdminOrders";
import { useAuth } from "../../context/auth";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

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
  return { Select: MockSelect };
});

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <div>Mock AdminMenu</div>);

jest.mock("../../context/auth", () => ({ useAuth: jest.fn() }));

describe("AdminOrders Component", () => {
  const mockAuthData = { user: { name: "Admin User" }, token: "valid-token" };
  const mockOrders = [
    {
      _id: "1",
      status: "Processing",
      buyer: { name: "John Doe" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        { _id: "p1", name: "Product 1", description: "Desc 1", price: 100 },
      ],
    },
    {
      _id: "2",
      status: "Not Process",
      buyer: { name: "Jane Doe" },
      createAt: new Date().toISOString(),
      payment: { success: false },
      products: [
        { _id: "p2", name: "Product 2", description: "Desc 2", price: 200 },
      ],
    },
  ];

  beforeEach(() => jest.clearAllMocks());

  it("should display orders when authenticated", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await waitFor(() =>
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length)
    );
    expect(
      screen.getByRole("heading", { name: /all orders/i })
    ).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
  });

  it("should display empty orders when not authenticated", async () => {
    useAuth.mockReturnValue([{ user: null, token: null }]);

    render(<AdminOrders />);

    await waitFor(() =>
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    );
    expect(axios.get).not.toHaveBeenCalled(); // API should not be called when not authenticated
  });

  it("should display error message when get orders API response is unsuccessful", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: { success: false } });

    render(<AdminOrders />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.FETCH_ORDERS_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
  });

  it("should display error message when get orders API request fails", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch orders"));

    render(<AdminOrders />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.FETCH_ORDERS_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
  });

  it("should display success message when order status is updated successfully", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<AdminOrders />);
    await waitFor(() =>
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length)
    );

    // Change the status of the first order to "Shipped"
    const newShippingStatus = "Shipped";
    const select = screen.getByDisplayValue(mockOrders[0].status);
    fireEvent.change(select, { target: { value: newShippingStatus } });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.UPDATE_STATUS_SUCCESS
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_ORDER_STATUS}/${mockOrders[0]._id}`,
      { status: newShippingStatus }
    );
    expect(axios.get).toHaveBeenCalledTimes(2); // Should fetch orders again after status change
  });

  it("should display error message when update order status API response is unsuccessful", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: false } });

    render(<AdminOrders />);
    await waitFor(() =>
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length)
    );

    // Change the status of the first order to "Shipped"
    const newShippingStatus = "Shipped";
    const select = screen.getByDisplayValue(mockOrders[0].status);
    fireEvent.change(select, { target: { value: newShippingStatus } });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.UPDATE_STATUS_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_ORDER_STATUS}/${mockOrders[0]._id}`,
      { status: newShippingStatus }
    );
    expect(axios.get).toHaveBeenCalledTimes(1); // Should not fetch orders again after status change failure
  });

  it("should display error message when update order status API request fails", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(new Error("Failed to update status"));

    render(<AdminOrders />);
    await waitFor(() =>
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length)
    );

    // Change the status of the first order to "Shipped"
    const newShippingStatus = "Shipped";
    const select = screen.getByDisplayValue(mockOrders[0].status);
    fireEvent.change(select, { target: { value: newShippingStatus } });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        ADMIN_ORDERS_STRINGS.UPDATE_STATUS_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_ORDER_STATUS}/${mockOrders[0]._id}`,
      { status: newShippingStatus }
    );
    expect(axios.get).toHaveBeenCalledTimes(1); // Should not fetch orders again after status change failure
  });
});
