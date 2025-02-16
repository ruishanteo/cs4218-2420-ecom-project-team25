import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

import CreateProduct, {
  CREATE_PRODUCT_STRINGS,
  API_URLS,
} from "./CreateProduct";

// Mock dependencies
jest.mock("axios");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("antd", () => {
  const actualAntd = jest.requireActual("antd");
  const MockSelect = ({ children, onChange, "data-testid": testId }) => (
    <select data-testid={testId} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );

  MockSelect.Option = ({ children, value, "data-testid": testId }) => (
    <option value={value} data-testid={testId}>
      {children}
    </option>
  );

  return { ...actualAntd, Select: MockSelect };
});

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

describe("CreateProduct Component", () => {
  const mockCategories = [{ _id: "1", name: "Electronics" }];
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("should fetch categories on mount", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });

    render(<CreateProduct />);

    await waitFor(() =>
      expect(
        within(
          screen.getByTestId("create-product-category-select")
        ).queryAllByTestId(/create-product-option/)
      ).toHaveLength(mockCategories.length)
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_CATEGORIES);
  });

  it("should show error toast if fetching categories fails", async () => {
    axios.get.mockResolvedValue({ data: { success: false } });

    render(<CreateProduct />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_PRODUCT_STRINGS.FETCH_CATEGORY_ERROR
      )
    );
    expect(
      within(
        screen.getByTestId("create-product-category-select")
      ).queryAllByTestId(/create-product-option/)
    ).toHaveLength(0);
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_CATEGORIES);
  });

  it("should show error toast if fetching categories throws exception", async () => {
    axios.get.mockRejectedValue(new Error("Fetch error"));

    render(<CreateProduct />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_PRODUCT_STRINGS.FETCH_CATEGORY_ERROR
      )
    );
    expect(
      within(
        screen.getByTestId("create-product-category-select")
      ).queryAllByTestId(/create-product-option/)
    ).toHaveLength(0);
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_CATEGORIES);
  });

  it("should update input fields and create a product", async () => {
    const user = userEvent.setup();
    const inputFormData = {
      name: "New Product",
      description: "New Description",
      price: "200",
      quantity: "10",
      photo: new File(["dummy content"], "test-photo.jpg", {
        type: "image/jpeg",
      }),
      category: mockCategories[0]._id,
      shipping: "false",
    };
    URL.createObjectURL = jest.fn().mockReturnValue("test-url");
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValue({ data: { success: true } });

    render(<CreateProduct />);

    // Wait for categories to be displayed
    await waitFor(() =>
      expect(
        within(
          screen.getByTestId("create-product-category-select")
        ).queryAllByTestId(/create-product-option/)
      ).toHaveLength(mockCategories.length)
    );

    // Fill form and submit
    fireEvent.change(screen.getByTestId("create-product-name-input"), {
      target: { value: inputFormData.name },
    });
    fireEvent.change(screen.getByTestId("create-product-description-input"), {
      target: { value: inputFormData.description },
    });
    fireEvent.change(screen.getByTestId("create-product-price-input"), {
      target: { value: inputFormData.price },
    });
    fireEvent.change(screen.getByTestId("create-product-quantity-input"), {
      target: { value: inputFormData.quantity },
    });
    fireEvent.change(screen.getByTestId("create-product-category-select"), {
      target: { value: inputFormData.category },
    });
    fireEvent.change(screen.getByTestId("create-product-shipping-select"), {
      target: { value: inputFormData.shipping },
    });
    const uploadInput = screen.getByTestId("create-product-photo-input");
    await act(async () => {
      await user.upload(uploadInput, inputFormData.photo);
    });
    await waitFor(() => {
      expect(uploadInput.files).toHaveLength(1);
    });
    fireEvent.click(screen.getByTestId("create-product-button"));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_PRODUCT_STRINGS.PRODUCT_CREATED
      )
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    expect(axios.post).toHaveBeenCalledWith(
      API_URLS.CREATE_PRODUCT,
      expect.any(FormData)
    );
    const actualFormData = axios.post.mock.calls[0][1];
    Object.entries(inputFormData).forEach(([key, value]) => {
      expect(actualFormData.get(key)).toBe(value);
    });
  });

  it("should handle product creation failure", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockResolvedValue({ data: { success: false } });

    render(<CreateProduct />);
    fireEvent.click(screen.getByTestId("create-product-button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ERROR
      )
    );
    expect(axios.post).toHaveBeenCalledWith(
      API_URLS.CREATE_PRODUCT,
      expect.any(FormData)
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should handle product creation throws exception", async () => {
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.post.mockRejectedValue(new Error("Create error"));

    render(<CreateProduct />);
    fireEvent.click(screen.getByTestId("create-product-button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ERROR
      )
    );
    expect(axios.post).toHaveBeenCalledWith(
      API_URLS.CREATE_PRODUCT,
      expect.any(FormData)
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
