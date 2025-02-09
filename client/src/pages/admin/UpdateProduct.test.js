import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

import UpdateProduct from "./UpdateProduct";

// Mock dependencies
jest.mock("axios");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

describe("UpdateProduct Component", () => {
  const mockNavigate = jest.fn();
  const mockParams = { slug: "test-product" };
  const mockProduct = {
    product: {
      _id: "123",
      name: "Test Product",
      description: "Test Description",
      price: 100,
      quantity: 5,
      shipping: true,
      category: { _id: "cat1", name: "Category 1" },
    },
  };
  const mockCategories = [
    {
      _id: "Category 1",
      name: "Category 1",
    },
    {
      _id: "Category 2",
      name: "Category 2",
    },
  ];

  const GET_SINGLE_PRODUCT_URL = `/api/v1/product/get-product/${mockParams.slug}`;
  const GET_ALL_CATEGORIES_URL = "/api/v1/category/get-category";
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue(mockParams);
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should fetch and display product details", async () => {
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });

    render(<UpdateProduct />);

    await screen.findByDisplayValue("Test Product");
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith(GET_SINGLE_PRODUCT_URL);
    expect(axios.get).toHaveBeenCalledWith(GET_ALL_CATEGORIES_URL);
    expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
  });

  it("should handle failure while fetching product details", async () => {
    const mockError = new Error("Failed to fetch product");
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.reject(mockError);
      } else if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });

    render(<UpdateProduct />);

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith(GET_SINGLE_PRODUCT_URL);
    expect(axios.get).toHaveBeenCalledWith(GET_ALL_CATEGORIES_URL);
  });

  it("should handle failure while fetching categories", async () => {
    axios.get.mockImplementation((url) => {
      if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({ data: { success: false } });
      }
      return Promise.resolve({ data: mockProduct });
    });

    render(<UpdateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
    expect(toast.error).not.toHaveBeenCalledWith(
      "Something wwent wrong in getting catgeory"
    );
  });

  it("should handle exception thrown while fetching categories", async () => {
    axios.get.mockImplementation((url) => {
      if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.reject(new Error("Failed to fetch categories"));
      }
      return Promise.resolve({ data: mockProduct });
    });

    render(<UpdateProduct />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something wwent wrong in getting catgeory"
      );
    });
  });

  it("should update the product successfully", async () => {
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.resolve({ data: mockProduct });
      } else if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });
    axios.put.mockImplementation((_, __) => ({
      data: { success: true },
    }));

    render(<UpdateProduct />);

    // Update product details and submit the form
    await screen.findByDisplayValue("Test Product");
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Updated Product" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "Updated Description" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "10" },
    });
    // TODO - Add test for category change
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Updated Successfully"
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("should handle failure during product update", async () => {
    const mockErrorMessage = "Failed to update product";
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.resolve({ data: mockProduct });
      } else if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });
    axios.put.mockImplementation((url, data) => ({
      data: { success: false, message: mockErrorMessage },
    }));

    render(<UpdateProduct />);

    // Trigger the update button click
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(mockErrorMessage);
    });
  });

  it("should handle exception thrown during product update", async () => {
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.resolve({ data: mockProduct });
      } else if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });
    axios.put.mockImplementation(() => null);

    render(<UpdateProduct />);

    fireEvent.click(screen.getByText("UPDATE PRODUCT")); // Trigger the update button click

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  it("should delete a product successfully", async () => {
    window.prompt = jest.fn().mockReturnValue(true);
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.resolve({ data: mockProduct });
      } else if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });
    axios.delete.mockResolvedValueOnce({ data: {} });

    render(<UpdateProduct />);

    // Trigger the delete button click
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Product DEleted Succfully");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    expect(axios.delete).toHaveBeenCalled();
  });

  it("should handle prompt cancel during product deletion", async () => {
    window.prompt = jest.fn().mockReturnValue(null);
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.resolve({ data: mockProduct });
      } else if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });

    render(<UpdateProduct />);

    // Trigger the delete button click
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(window.prompt).toHaveBeenCalled();
    });
    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("should handle failure during product deletion", async () => {
    window.prompt = jest.fn().mockReturnValue(true);
    const mockError = new Error("Failed to delete product");
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.resolve({ data: mockProduct });
      } else if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });
    axios.delete.mockRejectedValueOnce(mockError);

    render(<UpdateProduct />);

    // Trigger the delete button click
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
    expect(axios.delete).toHaveBeenCalled();
  });

  it("should handle file upload", async () => {
    const file = new File(["dummy content"], "test-photo.jpg", {
      type: "image/jpeg",
    });
    URL.createObjectURL = jest.fn().mockReturnValue("test-url");
    axios.get.mockImplementation((url) => {
      if (url === GET_SINGLE_PRODUCT_URL) {
        return Promise.resolve({ data: mockProduct });
      } else if (url === GET_ALL_CATEGORIES_URL) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });

    render(<UpdateProduct />);

    // Simulate file selection
    fireEvent.change(screen.getByLabelText("Upload Photo"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByAltText("product_photo")).toBeInTheDocument();
    });
  });

  // TODO - Fix this test
  //   it("should handle shipping option change", async () => {
  //     axios.get.mockImplementation((url) => {
  //       if (url === GET_SINGLE_PRODUCT_URL) {
  //         return Promise.resolve({ data: mockProduct });
  //       } else if (url === GET_ALL_CATEGORIES_URL) {
  //         return Promise.resolve({
  //           data: { success: true, category: mockCategories },
  //         });
  //       }
  //     });

  //     render(<UpdateProduct />);

  //     await screen.findByDisplayValue("Test Product");
  //     const selectElement = screen.getByRole("combobox");
  //     fireEvent.mouseDown(selectElement);

  //     const optionElement = screen.getByText("Yes");
  //     fireEvent.click(optionElement);

  //     expect(selectElement).toHaveTextContent("Yes");

  //     // await waitFor(() => {
  //     //   expect(shippingSelect.value).toBe("1");
  //     // });
  //   });
});
