import React from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import Users, { API_URLS, USERS_STRINGS } from "../../../pages/admin/Users";
import AdminRoute, {
  API_URLS as ADMIN_ROUTE_API_URLS,
} from "../../../components/Routes/AdminRoute";
import { API_URLS as CATEGORY_API_URLS } from "../../../hooks/useCategory";
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

describe("Users Integration Tests", () => {
  const mockUsers = [
    {
      _id: "1",
      name: "John Doe",
      email: "johndoe@gmail.com",
      phone: "91234567",
      address: "BLK 84 MARINE PARADE CENTRAL, #01-70",
    },
    {
      _id: "2",
      name: "Jane Doe",
      email: "janedoe@email.com",
      phone: "98765432",
      address: "BLK 123 BUKIT TIMAH, #02-34",
    },
  ];
  const mockCategories = [
    { _id: "1", name: "Category1" },
    { _id: "2", name: "Category2" },
  ];
  const mockAuthData = { user: { name: "Admin User" }, token: "valid-token" };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  const setAuthInLocalStorage = (authData) => {
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  const clearAuthFromLocalStorage = () => {
    localStorage.removeItem("auth");
  };

  const setup = () => {
    return render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
          <Routes>
            <Route path="/dashboard" element={<AdminRoute />}>
              <Route path="admin/users" element={<Users />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Providers>
    );
  };

  const mockAxiosGet = ({
    failUsersFetch = false,
    unsuccessfulUsersFetch = false,
    delayAPIResponse = false,
    failAuthCheck = false,
  } = {}) => {
    axios.get.mockImplementation((url) => {
      switch (url) {
        case ADMIN_ROUTE_API_URLS.CHECK_ADMIN_AUTH:
          return failAuthCheck
            ? Promise.resolve({ data: { ok: false } })
            : Promise.resolve({ data: { ok: true } });
        case CATEGORY_API_URLS.GET_CATEGORIES:
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        case API_URLS.GET_USERS:
          return failUsersFetch
            ? Promise.reject(new Error("Failed"))
            : unsuccessfulUsersFetch
            ? Promise.resolve({ data: { success: false } })
            : delayAPIResponse
            ? new Promise((resolve) =>
                setTimeout(
                  () => resolve({ data: { users: mockUsers, success: true } }),
                  100
                )
              )
            : Promise.resolve({ data: { users: mockUsers, success: true } });
        default:
          return Promise.reject(new Error("Not Found"));
      }
    });
  };

  it("should display users when API call is successful", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet();

    setup();

    await waitFor(() =>
      expect(screen.queryAllByTestId(/user-display-item-/)).toHaveLength(
        mockUsers.length
      )
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_USERS);
  });

  it("should display error when API response is unsuccessful", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet({ unsuccessfulUsersFetch: true });

    setup();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(USERS_STRINGS.FETCH_USERS_ERROR)
    );
    expect(screen.queryAllByTestId(/user-display-item-/)).toHaveLength(0);
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_USERS);
  });

  it("should display error when API request fails", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet({ failUsersFetch: true });

    setup();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(USERS_STRINGS.FETCH_USERS_ERROR)
    );
    expect(screen.queryAllByTestId(/user-display-item-/)).toHaveLength(0);
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_USERS);
  });

  it("should not update state if component unmounted before API response", async () => {
    setAuthInLocalStorage(mockAuthData);
    mockAxiosGet({ delayAPIResponse: true });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const { unmount } = setup();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /all users/i })
      ).toBeInTheDocument();
    });

    unmount();

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(USERS_STRINGS.COMPONENT_UNMOUNTED)
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_USERS);

    consoleSpy.mockRestore();
  });

  it("should redirect to login if user is not signed in", async () => {
    clearAuthFromLocalStorage();
    mockAxiosGet();

    setup();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /redirecting to you in/i })
      ).toBeInTheDocument();
    });
  });

  it("should redirect to login if user is not admin", async () => {
    setAuthInLocalStorage({ user: { name: "User" }, token: "valid-token" });
    mockAxiosGet({ failAuthCheck: true }); // Simulate failed auth check

    setup();

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
