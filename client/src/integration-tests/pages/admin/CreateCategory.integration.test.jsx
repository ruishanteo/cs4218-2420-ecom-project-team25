import React from "react";
import toast from "react-hot-toast";
import axios from "axios";
import userEvent from "@testing-library/user-event";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

import CreateCategory, {
  API_URLS,
  CREATE_CATEGORY_STRINGS,
} from "../../../pages/admin/CreateCategory";
import AdminRoute, {
  API_URLS as ADMIN_ROUTE_API_URLS,
} from "../../../components/Routes/AdminRoute";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";

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
  const mockAuthData = { user: { name: "Admin User" }, token: "valid-token" };
  const mockCategories = [{ _id: "1", name: "Electronics" }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setAuthInLocalStorage = (authData) => {
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  const clearAuthFromLocalStorage = () => {
    localStorage.removeItem("auth");
  };

  const setup = async (waitForCategories = true) => {
    render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/admin/create-category"]}>
          <Routes>
            <Route path="/dashboard" element={<AdminRoute />}>
              <Route
                path="admin/create-category"
                element={<CreateCategory />}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </Providers>
    );

    if (waitForCategories) {
      await waitFor(() => {
        expect(
          screen.getAllByRole("button", { name: /update .* category/i })
        ).toHaveLength(mockCategories.length);
      });
    }
  };

  const mockAxiosGet = ({ failAuthCheck = false } = {}) => {
    axios.get.mockImplementation((url) => {
      switch (url) {
        case ADMIN_ROUTE_API_URLS.CHECK_ADMIN_AUTH:
          return failAuthCheck
            ? Promise.resolve({ data: { ok: false } })
            : Promise.resolve({ data: { ok: true } });
        default:
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
      }
    });
  };

  it("should display fetched categories", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

    await setup();

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /update .* category/i })
      ).toHaveLength(mockCategories.length);
    });
  });

  it("should create a new category successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

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

  it("should redirect to login if user is not signed in", async () => {
    clearAuthFromLocalStorage();
    mockAxiosGet();

    await act(async () => {
      await setup(false); // Skip waiting for categories
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /redirecting to you in/i })
      ).toBeInTheDocument();
    });
  });

  it("should redirect to login if user is not an admin", async () => {
    setAuthInLocalStorage({
      user: { name: "Regular User" },
      token: "valid-token",
    });
    mockAxiosGet({ failAuthCheck: true }); // Simulate failed auth check

    await act(async () => {
      await setup(false); // Skip waiting for categories
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        ADMIN_ROUTE_API_URLS.CHECK_ADMIN_AUTH
      );
    });
    expect(
      screen.getByRole("heading", { name: /redirecting to you in/i })
    ).toBeInTheDocument();
  });
});
