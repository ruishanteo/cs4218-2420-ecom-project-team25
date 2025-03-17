import React from "react";
import toast from "react-hot-toast";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios, { AxiosError } from "axios";

import CreateCategory, {
  API_URLS,
  CREATE_CATEGORY_STRINGS,
} from "./CreateCategory";
import useCategory from "../../hooks/useCategory";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("../../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => <div>Mock AdminMenu</div>);

jest.mock(
  "../../components/Form/CategoryForm",
  () =>
    ({ handleSubmit, value, setValue }) =>
      (
        <form onSubmit={handleSubmit}>
          <label htmlFor="category-input">Category Name</label>
          <input
            id="category-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit">Submit</button>
        </form>
      )
);

describe("CreateCategory Component", () => {
  const mockCategories = [{ _id: "1", name: "Electronics" }];
  const mockRefreshCategories = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([mockCategories, mockRefreshCategories]);
  });

  it("should display categories", async () => {
    render(<CreateCategory />);

    expect(
      screen.getAllByRole("button", { name: /update .* category/i })
    ).toHaveLength(mockCategories.length);
  });

  it("should display success message when category is created successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(<CreateCategory />);

    // Create a new category
    const newCategory = "New Category";
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: newCategory },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_CREATED
      )
    );
    expect(axios.post).toHaveBeenCalledWith(API_URLS.CREATE_CATEGORY, {
      name: newCategory,
    });
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display duplicate category error message when category already exists", async () => {
    const error = new AxiosError();
    error.response = { data: { message: "Category Already Exists" } };
    axios.post.mockRejectedValueOnce(error);

    render(<CreateCategory />);

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DUPLICATE_CATEGORY_ERROR
      )
    );
    expect(axios.post).toHaveBeenCalledWith(
      API_URLS.CREATE_CATEGORY,
      expect.any(Object)
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error message when category creation API response is unsuccessful", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false } });

    render(<CreateCategory />);

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR
      )
    );
    expect(axios.post).toHaveBeenCalledWith(
      API_URLS.CREATE_CATEGORY,
      expect.any(Object)
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error message when category creation API request fails", async () => {
    axios.post.mockRejectedValueOnce(new Error("Failed to create category"));

    render(<CreateCategory />);

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR
      )
    );
    expect(axios.post).toHaveBeenCalledWith(
      API_URLS.CREATE_CATEGORY,
      expect.any(Object)
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display success message when category is deleted successfully", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    render(<CreateCategory />);

    fireEvent.click(
      screen.getByRole("button", { name: /delete electronics category/i })
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_DELETED
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_CATEGORY}/${mockCategories[0]._id}`
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error message when category deletion API response is unsuccessful", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: false } });

    render(<CreateCategory />);

    fireEvent.click(
      screen.getByRole("button", { name: /delete electronics category/i })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_CATEGORY}/${mockCategories[0]._id}`
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error message when category deletion API request fails", async () => {
    axios.delete.mockRejectedValueOnce(new Error("Failed to delete category"));

    render(<CreateCategory />);

    fireEvent.click(
      screen.getByRole("button", { name: /delete electronics category/i })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_CATEGORY}/${mockCategories[0]._id}`
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display success message when category update is successful", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<CreateCategory />);

    const updatedCategory = "Updated Category";
    fireEvent.click(
      screen.getByRole("button", { name: /update electronics category/i })
    );
    const modal = screen.getByRole("dialog");
    fireEvent.change(within(modal).getByRole("textbox"), {
      target: { value: updatedCategory },
    });
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_UPDATED
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_CATEGORY}/${mockCategories[0]._id}`,
      { name: updatedCategory }
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display duplicate category error message when category is updated to an existing one", async () => {
    const error = new AxiosError();
    error.response = { data: { message: "Category Already Exists" } };
    axios.put.mockRejectedValueOnce(error);

    render(<CreateCategory />);

    fireEvent.click(
      screen.getByRole("button", { name: /update electronics category/i })
    );
    const modal = screen.getByRole("dialog");
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DUPLICATE_CATEGORY_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_CATEGORY}/${mockCategories[0]._id}`,
      expect.any(Object)
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error message when category update API response is unsuccessful", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: false } });

    render(<CreateCategory />);

    fireEvent.click(
      screen.getByRole("button", { name: /update electronics category/i })
    );
    const modal = screen.getByRole("dialog");
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.UPDATE_CATEGORY_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_CATEGORY}/${mockCategories[0]._id}`,
      expect.any(Object)
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error message when category update API request fails", async () => {
    axios.put.mockRejectedValueOnce(new Error("Failed to update category"));

    render(<CreateCategory />);

    fireEvent.click(
      screen.getByRole("button", { name: /update electronics category/i })
    );
    const modal = screen.getByRole("dialog");
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.UPDATE_CATEGORY_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_CATEGORY}/${mockCategories[0]._id}`,
      expect.any(Object)
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should not update category when modal is closed", async () => {
    render(<CreateCategory />);

    // Attempt to update a category and close the modal
    fireEvent.click(
      screen.getByRole("button", { name: /update electronics category/i })
    );
    const modal = screen.getByRole("dialog");
    fireEvent.click(within(modal).getByRole("button", { name: "Close" }));

    // Wait for modal to close and no API call
    expect(axios.put).not.toHaveBeenCalled();
    expect(mockRefreshCategories).not.toHaveBeenCalled();
  });
});
