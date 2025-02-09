import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

import AdminOrders from "./AdminOrders";
import { useAuth } from "../../context/auth";

// Mock dependencies
jest.mock("axios");

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("AdminOrders Component", () => {
  let consoleLogSpy;
  const mockAuthData = {
    user: { name: "Admin User" },
    token: "valid-token",
  };
  const mockOrders = [
    {
      _id: "1",
      status: "Processing",
      buyer: { name: "John Doe" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {
          _id: "p1",
          name: "Product 1",
          description: "Product Description 1",
          price: 100,
        },
      ],
    },
    {
      _id: "2",
      status: "Not Process",
      buyer: { name: "Jane Doe" },
      createAt: new Date().toISOString(),
      payment: { success: false },
      products: [
        {
          _id: "p2",
          name: "Product 2",
          description: "Product Description 2",
          price: 200,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should display orders when authenticated", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    await screen.findByText("All Orders");
    expect(axios.get).toHaveBeenCalled();
    await screen.findByText("John Doe");
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product Description 1")).toBeInTheDocument();
  });

  // TODO Fix this test
  //   it("should handle order status change", async () => {
  //     useAuth.mockReturnValue([mockAuthData]);
  //     const copyMockOrders = [...mockOrders];
  //     copyMockOrders[0].status = "Shipped";

  //     axios.get.mockResolvedValueOnce({ data: mockOrders });
  //     //   .mockResolvedValueOnce({ data: copyMockOrders });
  //     axios.put.mockResolvedValueOnce({ data: { success: true } });

  //     render(<AdminOrders />);

  //     await screen.findByText("All Orders");
  //     await screen.findByText("John Doe");

  //     const select = screen.getByTestId(`status-${mockOrders[0]._id}`);
  //     console.info(select.value, select);

  //     const selectElement = screen.getByRole("combobox");
  //     userEvent.click(selectElement);

  //     console.info(select.value);
  //     expect(axios.put).toHaveBeenCalled();

  //     // fireEvent.change(select, { target: { value: "Shipped" } });
  //     // await waitFor(() => expect(axios.put).toHaveBeenCalled());
  //   });

  it("should display no orders message when there are no orders", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<AdminOrders />);

    await screen.findByText("All Orders");
    expect(axios.get).toHaveBeenCalled();
  });

  it("should not fetch orders when not authenticated", async () => {
    useAuth.mockReturnValue([
      {
        user: null,
        token: "",
      },
    ]);
    render(<AdminOrders />);

    await screen.findByText("All Orders");
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("should display error message on failed get orders", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    const mockError = new Error("Failed to fetch orders");
    axios.get.mockRejectedValue(mockError);

    render(<AdminOrders />);

    await screen.findByText("All Orders");
    expect(axios.get).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
  });
});
