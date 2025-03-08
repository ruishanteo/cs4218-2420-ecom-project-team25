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

jest.mock("../../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <div>Mock AdminMenu</div>);

function getCaseInsensitiveRegex(text) {
  return new RegExp(text, "i");
}

describe("UpdateProduct", () => {
  const mockNavigate = jest.fn();
  const mockParams = { slug: "test-product" };
  const mockCategories = [
    { _id: "1", name: "Category1" },
    { _id: "2", name: "Category2" },
  ];
  const mockProduct = {
    _id: "123",
    name: "Test Product",
    description: "Test Description",
    price: 100,
    quantity: 5,
    photo: "test-photo.jpg",
    shipping: true,
    category: mockCategories[0],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([mockCategories, jest.fn()]);
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue(mockParams);
  });

  it("should fetch and display product details", async () => {
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });

    render(<UpdateProduct />);

    // Wait for the product details to load and check if the form fields are populated
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );
    expect(
      screen.getByRole("textbox", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
        ),
      })
    ).toHaveValue(mockProduct.description);
    expect(
      screen.getByRole("spinbutton", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER
        ),
      })
    ).toHaveValue(mockProduct.price);
    expect(
      screen.getByRole("spinbutton", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
        ),
      })
    ).toHaveValue(mockProduct.quantity);
    expect(
      screen.getByRole("combobox", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.SELECT_SHIPPING_ACTION
        ),
      })
    ).toHaveValue(mockProduct.shipping.toString());
    expect(
      screen.getByRole("combobox", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
        ),
      })
    ).toHaveValue(mockProduct.category._id);
    expect(
      screen.getByRole("img", {
        name: getCaseInsensitiveRegex(UPDATE_PRODUCT_STRINGS.PHOTO_PLACEHODER),
      })
    ).toHaveAttribute(
      "src",
      `${API_URLS.GET_PRODUCT_PHOTO}/${mockProduct._id}`
    );
    expect(axios.get).toHaveBeenCalledWith(
      `${API_URLS.GET_PRODUCT}/${mockParams.slug}`
    );
  });

  it("should display error message when fetch product API response is unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false } });

    render(<UpdateProduct />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.FETCH_PRODUCT_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledWith(
      `${API_URLS.GET_PRODUCT}/${mockParams.slug}`
    );
  });

  it("should display error message when fetch product API request fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Fetch error"));

    render(<UpdateProduct />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.FETCH_PRODUCT_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledWith(
      `${API_URLS.GET_PRODUCT}/${mockParams.slug}`
    );
  });

  it("should update the product successfully", async () => {
    const user = userEvent.setup();
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
    URL.createObjectURL = jest.fn().mockReturnValue("test-url");
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<UpdateProduct />);

    // Wait for the product details to load
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );

    // Update product details and submit the form
    fireEvent.change(
      screen.getByRole("textbox", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
        ),
      }),
      {
        target: { value: inputFormData.name },
      }
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
        ),
      }),
      {
        target: { value: inputFormData.description },
      }
    );
    fireEvent.change(
      screen.getByRole("spinbutton", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER
        ),
      }),
      {
        target: { value: inputFormData.price },
      }
    );
    fireEvent.change(
      screen.getByRole("spinbutton", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
        ),
      }),
      {
        target: { value: inputFormData.quantity },
      }
    );
    fireEvent.change(
      screen.getByRole("combobox", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
        ),
      }),
      {
        target: { value: inputFormData.category },
      }
    );
    fireEvent.change(
      screen.getByRole("combobox", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.SELECT_SHIPPING_ACTION
        ),
      }),
      {
        target: { value: inputFormData.shipping },
      }
    );
    const uploadInput = screen.getByLabelText(
      getCaseInsensitiveRegex(UPDATE_PRODUCT_STRINGS.UPLOAD_PHOTO_ACTION)
    );
    await act(async () => {
      await user.upload(uploadInput, inputFormData.photo);
    });
    await waitFor(() => expect(uploadInput.files).toHaveLength(1));
    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.PRODUCT_UPDATED
      )
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_PRODUCT}/${mockProduct._id}`,
      expect.any(FormData)
    );
    const actualFormData = axios.put.mock.calls[0][1];
    Object.keys(inputFormData).forEach((key) => {
      expect(actualFormData.get(key)).toBe(inputFormData[key]);
    });
  });

  it("should display error message when update product API response is unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });
    axios.put.mockResolvedValueOnce({ data: { success: false } });

    render(<UpdateProduct />);

    // Wait for the product details to load
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );

    // Submit the form
    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_PRODUCT}/${mockProduct._id}`,
      expect.any(FormData)
    );
  });

  it("should display error message when update product API request fails", async () => {
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });
    axios.put.mockRejectedValueOnce(new Error("Update error"));

    render(<UpdateProduct />);

    // Wait for the product details to load
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );

    // Submit the form
    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_PRODUCT}/${mockProduct._id}`,
      expect.any(FormData)
    );
  });

  it("should delete a product successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    window.prompt = jest.fn().mockReturnValue(true); // Simulate confirmation

    render(<UpdateProduct />);

    // Wait for the product details to load
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );

    // Simulate deleting the product
    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION
        ),
      })
    );

    // Wait for success message
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.PRODUCT_DELETED
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_PRODUCT}/${mockProduct._id}`
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  it("should display error message when delete product API response is unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });
    axios.delete.mockResolvedValueOnce({ data: { success: false } });
    window.prompt = jest.fn().mockReturnValue(true); // Simulate confirmation

    render(<UpdateProduct />);

    // Wait for the product details to load
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );

    // Simulate deleting the product
    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION
        ),
      })
    );

    // Wait for error message
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ERROR
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_PRODUCT}/${mockProduct._id}`
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should display error message when delete product API request fails", async () => {
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });
    axios.delete.mockRejectedValueOnce(new Error("Delete error"));
    window.prompt = jest.fn().mockReturnValue(true); // Simulate confirmation

    render(<UpdateProduct />);

    // Wait for the product details to load
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );

    // Simulate deleting the product
    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION
        ),
      })
    );

    // Wait for error message
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ERROR
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_PRODUCT}/${mockProduct._id}`
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should not delete a product when confirmation is false", async () => {
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });
    window.prompt = jest.fn().mockReturnValue(false); // Simulate confirmation

    render(<UpdateProduct />);

    // Wait for the product details to load
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );

    // Simulate deleting the product
    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION
        ),
      })
    );

    // Check if the product was not deleted
    await waitFor(() => expect(window.prompt).toHaveBeenCalled());
    expect(axios.delete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
