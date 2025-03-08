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
import useCategory from "../../hooks/useCategory";

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

describe("CreateProduct Component", () => {
  const mockCategories = [{ _id: "1", name: "Electronics" }];
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([mockCategories, jest.fn()]);
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("should display categories", async () => {
    render(<CreateProduct />);

    const categorySelect = await screen.findByRole("combobox", {
      name: getCaseInsensitiveRegex(
        CREATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
      ),
    });

    expect(categorySelect).toBeInTheDocument();
    const options = within(categorySelect).getAllByRole("option");
    expect(options).toHaveLength(mockCategories.length);
  });

  it("should update input fields and create a product successfully", async () => {
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
    axios.post.mockResolvedValue({ data: { success: true } });

    render(<CreateProduct />);

    // Fill form and submit
    await act(async () => {
      await user.type(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        }),
        inputFormData.name
      );
      await user.type(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
          ),
        }),
        inputFormData.description
      );
      await user.type(
        screen.getByRole("spinbutton", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER
          ),
        }),
        inputFormData.price
      );
      await user.type(
        screen.getByRole("spinbutton", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
          ),
        }),
        inputFormData.quantity
      );
      await user.selectOptions(
        screen.getByRole("combobox", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
          ),
        }),
        inputFormData.category
      );
      await user.selectOptions(
        screen.getByRole("combobox", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.SELECT_SHIPPING_ACTION
          ),
        }),
        inputFormData.shipping
      );
      await user.upload(
        screen.getByLabelText(
          getCaseInsensitiveRegex(CREATE_PRODUCT_STRINGS.UPLOAD_PHOTO_ACTION)
        ),
        inputFormData.photo
      );
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ACTION
        ),
      })
    );

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

  it("should display error message when product creation API response is unsuccessful", async () => {
    axios.post.mockResolvedValue({ data: { success: false } });

    render(<CreateProduct />);

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ACTION
        ),
      })
    );

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

  it("should display error message when product creation API request fails", async () => {
    axios.post.mockRejectedValue(new Error("Create error"));

    render(<CreateProduct />);

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ACTION
        ),
      })
    );

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
