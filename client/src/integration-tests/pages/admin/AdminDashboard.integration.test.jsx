import React from "react";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import AdminDashboard from "../../../pages/admin/AdminDashboard";
import AdminRoute from "../../../components/Routes/AdminRoute";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";

jest.mock("axios");

const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("AdminDashboard Integration Tests", () => {
  const mockAuthData = {
    user: {
      name: "Admin User",
      email: "admin@example.com",
      phone: "9876543210",
    },
    token: "valid-token",
  };

  const setAuthInLocalStorage = (authData) => {
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  const clearAuthFromLocalStorage = () => {
    localStorage.removeItem("auth");
  };

  const setup = () => {
    return render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/admin"]}>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Providers>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should display admin details when authenticated", async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });
    setAuthInLocalStorage(mockAuthData);
    setup();

    await waitFor(() => {
      expect(screen.getByText("Admin Name : Admin User")).toBeInTheDocument();
      expect(
        screen.getByText("Admin Email : admin@example.com")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Admin Contact : 9876543210")
      ).toBeInTheDocument();
    });
  });

  it("should render AdminMenu component", async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });
    setAuthInLocalStorage(mockAuthData);
    setup();

    await waitFor(() => {
      const adminMenu = document.querySelector(".list-group.dashboard-menu");
      expect(adminMenu).toBeInTheDocument();
    });
  });

  it("should not display admin details when not authenticated", async () => {
    clearAuthFromLocalStorage();
    setup();

    expect(screen.queryByText("Admin Name :")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Email :")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Contact :")).not.toBeInTheDocument();
  });

  it("should render Layout component", async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });
    setAuthInLocalStorage(mockAuthData);
    setup();

    await waitFor(() => {
      expect(screen.getByText("Admin Name : Admin User")).toBeInTheDocument();
    });
  });

  it("should display correct data when different mock admin data is passed", async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });
    const customAdmin = {
      user: {
        name: "Custom Admin",
        email: "customadmin@example.com",
        phone: "1234567890",
      },
      token: "valid-token",
    };
    setAuthInLocalStorage(customAdmin);
    setup();

    await waitFor(() => {
      expect(screen.getByText("Admin Name : Custom Admin")).toBeInTheDocument();
      expect(
        screen.getByText("Admin Email : customadmin@example.com")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Admin Contact : 1234567890")
      ).toBeInTheDocument();
    });
  });
});
