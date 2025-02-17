import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

import UpdateProduct, {
  UPDATE_PRODUCT_STRINGS,
  API_URLS,
} from "./UpdateProduct";
import useCategory from "../../hooks/useCategory";

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

jest.mock("antd", () => {
  const actualAntd = jest.requireActual("antd");
  const MockSelect = ({
    children,
    onChange,
    "data-testid": testId,
    defaultValue,
  }) => (
    <select
      data-testid={testId}
      defaultValue={defaultValue}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );

  MockSelect.Option = ({ children, value, "data-testid": testId }) => (
    <option value={value} data-testid={testId}>
      {children}
    </option>
  );

  return {
    ...actualAntd,
    Select: MockSelect,
  };
});

jest.mock("../../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => [[], jest.fn()]),
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
    success: true,
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

  const GET_SINGLE_PRODUCT_URL = `${API_URLS.GET_PRODUCT}/${mockParams.slug}`;

  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([mockCategories, jest.fn()]);
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue(mockParams);
  });

  it("should fetch and display product details", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct }); // Simulate success

    render(<UpdateProduct />);

    // Wait for the product details to load and check if the form fields are populated
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    expect(
      screen.getByTestId("admin-update-product-description-input")
    ).toHaveDisplayValue(mockProduct.product.description);
    expect(
      screen.getByTestId("admin-update-product-price-input")
    ).toHaveDisplayValue(mockProduct.product.price.toString());
    expect(
      screen.getByTestId("admin-update-product-quantity-input")
    ).toHaveDisplayValue(mockProduct.product.quantity.toString());
    expect(axios.get).toHaveBeenCalledWith(GET_SINGLE_PRODUCT_URL);
  });

  it("should display error message when product fetch fails", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false } }); // Simulate failure

    render(<UpdateProduct />);

    // Wait for error message and API call
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.FETCH_PRODUCT_ERROR
      );
    });
    expect(axios.get).toHaveBeenCalledWith(GET_SINGLE_PRODUCT_URL);
  });

  it("should display error message when product fetch throws an exception", async () => {
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch product")); // Simulate exception

    render(<UpdateProduct />);

    // Wait for error message and API call
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.FETCH_PRODUCT_ERROR
      );
    });
    expect(axios.get).toHaveBeenCalledWith(GET_SINGLE_PRODUCT_URL);
  });

  it("should update the product successfully", async () => {
    const inputFormData = {
      name: "Updated Product",
      description: "Updated Description",
      price: "200",
      quantity: "10",
      photo: new File(["dummy content"], "test-photo.jpg", {
        type: "image/jpeg",
      }),
      category: mockCategories[1]._id,
      shipping: "false",
    };
    const user = userEvent.setup();
    URL.createObjectURL = jest.fn().mockReturnValue("test-url");
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.put.mockResolvedValueOnce({ data: { success: true } }); // Simulate success

    render(<UpdateProduct />);

    // Wait for the product details to load
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );

    // Update product details and submit the form
    fireEvent.change(screen.getByTestId("admin-update-product-name-input"), {
      target: { value: inputFormData.name },
    });
    fireEvent.change(
      screen.getByTestId("admin-update-product-description-input"),
      {
        target: { value: inputFormData.description },
      }
    );
    fireEvent.change(screen.getByTestId("admin-update-product-price-input"), {
      target: { value: inputFormData.price },
    });
    fireEvent.change(
      screen.getByTestId("admin-update-product-quantity-input"),
      {
        target: { value: inputFormData.quantity },
      }
    );
    fireEvent.change(
      screen.getByTestId("admin-update-product-category-select"),
      { target: { value: inputFormData.category } }
    );
    fireEvent.change(
      screen.getByTestId("admin-update-product-shipping-select"),
      { target: { value: inputFormData.shipping } }
    );
    const uploadInput = screen.getByTestId("admin-update-product-photo-input");
    await act(async () => {
      await user.upload(uploadInput, inputFormData.photo);
    });
    await waitFor(() => {
      expect(uploadInput.files).toHaveLength(1);
    });
    fireEvent.click(screen.getByTestId("admin-update-product-button"));

    // Wait for success message and API call
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.PRODUCT_UPDATED
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_PRODUCT}/${mockProduct.product._id}`,
      expect.any(FormData)
    );
    const actualFormData = axios.put.mock.calls[0][1];
    Object.keys(inputFormData).forEach((key) => {
      expect(actualFormData.get(key)).toBe(inputFormData[key]);
    });
  });

  it("should display error message when product update fails", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.put.mockResolvedValueOnce({ data: { success: false } }); // Simulate failure

    render(<UpdateProduct />);

    // Wait for the product details to load and trigger the update button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByTestId("admin-update-product-button"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ERROR
      );
    });
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_PRODUCT}/${mockProduct.product._id}`,
      expect.any(FormData)
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should display error message when product update throws an exception", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.put.mockRejectedValueOnce(new Error("Failed to update product")); // Simulate exception

    render(<UpdateProduct />);

    // Wait for the product details to load and trigger the update button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in updating product"
      );
    });
    expect(axios.put).toHaveBeenCalledWith(
      `/api/v1/product/update-product/${mockProduct.product._id}`,
      expect.any(FormData)
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should delete a product successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.delete.mockResolvedValueOnce({ data: { success: true } }); // Simulate success
    window.prompt = jest.fn().mockReturnValue(true); // Simulate confirmation

    render(<UpdateProduct />);

    // Wait for the product details to load and trigger the delete button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByTestId("admin-delete-product-button"));

    // Wait for success message and API call
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(axios.delete).toHaveBeenCalledWith(
      `/api/v1/product/delete-product/${mockProduct.product._id}`
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("should display error message when product deletion fails", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.delete.mockResolvedValueOnce({ success: false }); // Simulate failure
    window.prompt = jest.fn().mockReturnValue(true); // Simulate confirmation

    render(<UpdateProduct />);

    // Wait for the product details to load and trigger the delete button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByTestId("admin-delete-product-button"));

    // Wait for error message and API call
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ERROR
      );
    });
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_PRODUCT}/${mockProduct.product._id}`
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should display error message when product deletion throws an exception", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    axios.delete.mockRejectedValueOnce(new Error("Failed to delete product")); // Simulate exception
    window.prompt = jest.fn().mockReturnValue(true); // Simulate confirmation

    render(<UpdateProduct />);

    // Wait for the product details to load and trigger the delete button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByTestId("admin-delete-product-button"));

    // Wait for error message and API call
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ERROR
      );
    });
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_PRODUCT}/${mockProduct.product._id}`
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should handle prompt cancel during product deletion", async () => {
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    window.prompt = jest.fn().mockReturnValue(null); // Simulate cancel

    render(<UpdateProduct />);

    // Wait for the product details to load and trigger the delete button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByTestId("admin-delete-product-button"));

    // Wait for prompt and check if delete API is not called
    await waitFor(() => {
      expect(window.prompt).toHaveBeenCalled();
    });
    expect(axios.delete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
