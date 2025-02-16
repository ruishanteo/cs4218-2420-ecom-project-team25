import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

import UpdateProduct, {
  UPDATE_PRODUCT_STRINGS,
  API_URLS,
} from "./UpdateProduct";

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

  MockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  return {
    ...actualAntd,
    Select: MockSelect,
  };
});

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

  const GET_SINGLE_PRODUCT_URL = `${API_URLS.GET_PRODUCT}/${mockParams.slug}`;
  const GET_ALL_CATEGORIES_URL = API_URLS.GET_CATEGORY;

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue(mockParams);
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
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith(GET_SINGLE_PRODUCT_URL);
    expect(axios.get).toHaveBeenCalledWith(GET_ALL_CATEGORIES_URL);
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
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.FETCH_PRODUCT_ERROR
      );
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
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.FETCH_CATEGORY_ERROR
      );
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith(GET_SINGLE_PRODUCT_URL);
    expect(axios.get).toHaveBeenCalledWith(GET_ALL_CATEGORIES_URL);
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
        UPDATE_PRODUCT_STRINGS.FETCH_CATEGORY_ERROR
      );
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
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
      // "category": mockProduct.product.category._id
    };
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
    axios.put.mockImplementation((_, __) => ({
      data: { success: true },
    }));

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
    fireEvent.change(screen.getByTestId("admin-upload-photo-button"), {
      target: { files: [inputFormData.photo] },
    });
    fireEvent.change(
      screen.getByTestId("admin-update-product-category-select"),
      { target: { value: mockCategories[1].name } }
    );
    fireEvent.change(
      screen.getByTestId("admin-update-product-shipping-select"),
      { target: { value: (!mockProduct.product.shipping).toString() } }
    );
    fireEvent.click(screen.getByTestId("admin-update-product-button"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.PRODUCT_UPDATED
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    // formData.append("category", mockProduct.product.category._id);
    expect(axios.put).toHaveBeenCalledWith(
      `/api/v1/product/update-product/${mockProduct.product._id}`,
      expect.any(FormData)
    );
    // TODO: Fix this test
    // const actualFormData = axios.put.mock.calls[0][1];
    Object.keys(inputFormData).forEach((key) => {
      // console.log(key, actualFormData.get(key));
      // expect(actualFormData.get(key)).toBe(inputFormData[key]);
    });
  });

  it("should handle failure during product update", async () => {
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
      data: { success: false, message: "Failed to update product" },
    }));

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
      `/api/v1/product/update-product/${mockProduct.product._id}`,
      expect.any(FormData)
    );
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

    // Wait for the product details to load and trigger the delete button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByTestId("admin-delete-product-button"));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        `/api/v1/product/delete-product/${mockProduct.product._id}`
      );
    });
    expect(toast.success).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
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

    // Wait for the product details to load and trigger the delete button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByTestId("admin-delete-product-button"));

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

    // Wait for the product details to load and trigger the delete button click
    await waitFor(() =>
      expect(
        screen.getByTestId("admin-update-product-name-input")
      ).toHaveDisplayValue(mockProduct.product.name)
    );
    fireEvent.click(screen.getByTestId("admin-delete-product-button"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ERROR
      );
    });
    expect(axios.delete).toHaveBeenCalled();
  });

  // // TODO - Fix this test
  // //   it("should handle shipping option change", async () => {
  // //     axios.get.mockImplementation((url) => {
  // //       if (url === GET_SINGLE_PRODUCT_URL) {
  // //         return Promise.resolve({ data: mockProduct });
  // //       } else if (url === GET_ALL_CATEGORIES_URL) {
  // //         return Promise.resolve({
  // //           data: { success: true, category: mockCategories },
  // //         });
  // //       }
  // //     });

  // //     render(<UpdateProduct />);

  // //     await screen.findByDisplayValue("Test Product");
  // //     const selectElement = screen.getByRole("combobox");
  // //     fireEvent.mouseDown(selectElement);

  // //     const optionElement = screen.getByText("Yes");
  // //     fireEvent.click(optionElement);

  // //     expect(selectElement).toHaveTextContent("Yes");

  // //     // await waitFor(() => {
  // //     //   expect(shippingSelect.value).toBe("1");
  // //     // });
  // //   });
});
