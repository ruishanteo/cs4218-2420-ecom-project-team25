import React from "react";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";

import CreateCategory, {
  API_URLS,
  CREATE_CATEGORY_STRINGS,
} from "../../pages/admin/CreateCategory";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";

jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

jest.mock("axios");

Object.defineProperty(window, "matchMedia", {
  value: jest.fn(() => {
    return {
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  }),
});

const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("CreateCategory Integration Tests", () => {
  const user = userEvent.setup();
  const mockCategories = [{ _id: "1", name: "Electronics" }];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  });

  const setup = async () => {
    render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/admin/create-category"]}>
          <Routes>
            <Route
              path="/dashboard/admin/create-category"
              element={<CreateCategory />}
            />
          </Routes>
        </MemoryRouter>
      </Providers>
    );

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /update .* category/i })
      ).toHaveLength(mockCategories.length);
    });
  };

  it("should display fetched categories", async () => {
    await setup();

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /update .* category/i })
      ).toHaveLength(mockCategories.length);
    });
  });

  it("should create a new category successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    await setup();

    const input = screen.getByRole("textbox");
    await act(async () => {
      await user.type(input, "New Category");
    });

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_CREATED
      );
    });
    expect(axios.post).toHaveBeenCalledWith(API_URLS.CREATE_CATEGORY, {
      name: "New Category",
    });
  });

  it("should handle failed category creation", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false } });
    await setup();

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR
      );
    });
  });

  it("should handle API error during creation", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));
    await setup();

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR
      );
    });
  });

  it("should update a category successfully", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    await setup();

    fireEvent.click(
      screen.getByRole("button", { name: /update electronics category/i })
    );
    const modal = screen.getByRole("dialog");
    const input = within(modal).getByRole("textbox");
    await act(async () => {
      await user.clear(input);
      await user.type(input, "Updated Electronics");
    });
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_UPDATED
      );
    });
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_CATEGORY}/${mockCategories[0]._id}`,
      { name: "Updated Electronics" }
    );
  });

  it("should handle failed category update", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: false } });
    await setup();

    fireEvent.click(
      screen.getByRole("button", { name: /update electronics category/i })
    );
    const modal = screen.getByRole("dialog");
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.UPDATE_CATEGORY_ERROR
      );
    });
  });

  it("should delete a category successfully", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    await setup();

    fireEvent.click(
      screen.getByRole("button", { name: /delete electronics category/i })
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.CATEGORY_DELETED
      );
    });
    expect(axios.delete).toHaveBeenCalledWith(
      `${API_URLS.DELETE_CATEGORY}/${mockCategories[0]._id}`
    );
  });

  it("should handle failed delete operation", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: false } });
    await setup();

    fireEvent.click(
      screen.getByRole("button", { name: /delete electronics category/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR
      );
    });
  });

  it("should handle API error during delete", async () => {
    axios.delete.mockRejectedValueOnce(new Error("Delete error"));
    await setup();

    fireEvent.click(
      screen.getByRole("button", { name: /delete electronics category/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR
      );
    });
  });

  it("should not call API if modal is closed without submitting update", async () => {
    await setup();

    fireEvent.click(
      screen.getByRole("button", { name: /update electronics category/i })
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Close" })
    );

    await waitFor(() => {
      expect(axios.put).not.toHaveBeenCalled();
    });
  });
});
