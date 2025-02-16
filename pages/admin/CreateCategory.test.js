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

import CreateCategory, { CREATE_CATEGORY_STRINGS } from "./CreateCategory";

// Mock dependencies
jest.mock("axios");

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and display categories", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );
    expect(axios.get).toHaveBeenCalled();
  });

  it("should display error when fetching categories fails", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false } });
    render(<CreateCategory />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.FETCH_CATEGORY_ERROR
      )
    );
    expect(
      within(screen.getByTestId("create-category-list")).queryAllByTestId(
        /create-category-/
      )
    ).toHaveLength(0);
  });

  it("should display error when fetching categories throws exception", async () => {
    axios.get.mockRejectedValueOnce(new Error("Fetch failed"));
    render(<CreateCategory />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.FETCH_CATEGORY_ERROR
      )
    );
    expect(
      within(screen.getByTestId("create-category-list")).queryAllByTestId(
        /create-category-/
      )
    ).toHaveLength(0);
  });

  it("should create a new category and display success message", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    // Wait for categories to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

    // Create a new category
    const input = screen.getByTestId("category-input");
    fireEvent.change(input, { target: { value: "New Category" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_CREATED
      )
    );
    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/category/create-category",
      { name: "New Category" }
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should display error when category creation fails", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false } });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    // Wait for categories to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

    fireEvent.click(screen.getByTestId("submit-button"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should display error when category creation throws exception", async () => {
    axios.post.mockRejectedValueOnce(new Error("Creation failed"));
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    // Wait for categories to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

    fireEvent.click(screen.getByTestId("submit-button"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR
      )
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should delete a category and display success message", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    // Wait for categories to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`delete-category-${id}`));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_DELETED
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `/api/v1/category/delete-category/${id}`
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should display error when category deletion fails", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: false } });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    // Wait for categories to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`delete-category-${id}`));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `/api/v1/category/delete-category/${id}`
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should display error when category deletion throws exception", async () => {
    axios.delete.mockRejectedValueOnce(new Error("Deletion failed"));
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    // Wait for categories to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`delete-category-${id}`));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR
      )
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `/api/v1/category/delete-category/${id}`
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should update a category and display success message", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

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
      `/api/v1/category/update-category/${id}`,
      { name: "Updated Category" }
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should display error when category update fails", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: false } });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

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
      `/api/v1/category/update-category/${id}`,
      { name: "Updated Category" }
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should display error when category update throws exception", async () => {
    axios.put.mockRejectedValueOnce(new Error("Update failed"));
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

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
      `/api/v1/category/update-category/${id}`,
      { name: "Updated Category" }
    );
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should cancel modal", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(<CreateCategory />);

    await waitFor(() =>
      expect(
        within(screen.getByTestId("create-category-list")).queryAllByTestId(
          /create-category-/
        )
      ).toHaveLength(mockCategories.length)
    );

    const id = mockCategories[0]._id;
    fireEvent.click(screen.getByTestId(`update-category-${id}`));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(axios.put).not.toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
