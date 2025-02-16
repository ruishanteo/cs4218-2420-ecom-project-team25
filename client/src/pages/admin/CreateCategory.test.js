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
import axios from "axios";

import CreateCategory, {
  API_URLS,
  CREATE_CATEGORY_STRINGS,
} from "./CreateCategory";
import useCategory from "../../hooks/useCategory";

// Mock dependencies
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
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

jest.mock(
  "../../components/Form/CategoryForm",
  () =>
    ({ handleSubmit, value, setValue }) =>
      (
        <div data-testid="category-form">
          <input
            data-testid="category-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button data-testid="submit-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )
);

describe("CreateCategory Component", () => {
  const mockCategories = [{ _id: "1", name: "Electronics" }];
  const mockRefreshCategories = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([mockCategories, mockRefreshCategories]);
  });

  it("should create a new category and display success message", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(<CreateCategory />);

    // Create a new category
    const newCategory = "New Category";
    const input = screen.getByTestId("category-input");
    fireEvent.change(input, { target: { value: newCategory } });
    fireEvent.click(screen.getByTestId("submit-button"));

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

  it("should display error when category creation fails", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false } });

    render(<CreateCategory />);

    // Create a new category
    const newCategory = "New Category";
    const input = screen.getByTestId("category-input");
    fireEvent.change(input, { target: { value: newCategory } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR
      )
    );
    expect(axios.post).toHaveBeenCalledWith(API_URLS.CREATE_CATEGORY, {
      name: newCategory,
    });
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error when category creation throws exception", async () => {
    axios.post.mockRejectedValueOnce(new Error("Creation failed"));

    render(<CreateCategory />);

    // Create a new category
    const newCategory = "New Category";
    const input = screen.getByTestId("category-input");
    fireEvent.change(input, { target: { value: newCategory } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR
      )
    );
    expect(axios.post).toHaveBeenCalledWith(API_URLS.CREATE_CATEGORY, {
      name: newCategory,
    });
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should delete a category and display success message", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    render(<CreateCategory />);

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`delete-category-${id}`));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_DELETED
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_CATEGORY}/${id}`
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error when category deletion fails", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: false } });

    render(<CreateCategory />);

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`delete-category-${id}`));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_CATEGORY}/${id}`
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error when category deletion throws exception", async () => {
    axios.delete.mockRejectedValueOnce(new Error("Deletion failed"));

    render(<CreateCategory />);

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`delete-category-${id}`));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_CATEGORY}/${id}`
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should update a category and display success message", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<CreateCategory />);

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`update-category-${id}`));
    const modal = screen.getByTestId("update-category-modal");
    fireEvent.change(within(modal).getByTestId("category-input"), {
      target: { value: "Updated Category" },
    });
    fireEvent.click(within(modal).getByTestId("submit-button"));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_UPDATED
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_CATEGORY}/${id}`,
      { name: "Updated Category" }
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error when category update fails", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: false } });
    render(<CreateCategory />);

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`update-category-${id}`));
    const modal = screen.getByTestId("update-category-modal");
    fireEvent.change(within(modal).getByTestId("category-input"), {
      target: { value: "Updated Category" },
    });
    fireEvent.click(within(modal).getByTestId("submit-button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.UPDATE_CATEGORY_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_CATEGORY}/${id}`,
      { name: "Updated Category" }
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should display error when category update throws exception", async () => {
    axios.put.mockRejectedValueOnce(new Error("Update failed"));

    render(<CreateCategory />);

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`update-category-${id}`));
    const modal = screen.getByTestId("update-category-modal");
    fireEvent.change(within(modal).getByTestId("category-input"), {
      target: { value: "Updated Category" },
    });
    fireEvent.click(within(modal).getByTestId("submit-button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.UPDATE_CATEGORY_ERROR
      )
    );
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_CATEGORY}/${id}`,
      { name: "Updated Category" }
    );
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it("should cancel modal", async () => {
    render(<CreateCategory />);

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`update-category-${id}`));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(axios.put).not.toHaveBeenCalled();
    expect(mockRefreshCategories).not.toHaveBeenCalled();
  });
});
