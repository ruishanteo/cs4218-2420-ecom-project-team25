import React from "react";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import AdminDashboard from "../../../pages/admin/AdminDashboard";
import AdminRoute from "../../../components/routes/AdminRoute";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import { useAuth } from "../../../context/auth";

jest.mock("axios");
jest.mock("../../../context/auth", () => ({
  useAuth: jest.fn(),
}));

const Providers = ({ children }) => {
  return (
    <CartProvider>
      <SearchProvider>{children}</SearchProvider>
    </CartProvider>
  );
};

describe("AdminDashboard Integration Tests", () => {
  const mockAdmin = {
    user: {
      name: "Admin User",
      email: "admin@example.com",
      phone: "9876543210",
    },
  };

  const setup = (authValue = mockAdmin) => {
    useAuth.mockReturnValue([authValue, jest.fn()]);

    return render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/admin"]}>
          <Routes>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
          </Routes>
        </MemoryRouter>
      </Providers>
    );
  };

  it("should display admin details when authenticated", async () => {
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
    setup();

    await waitFor(() => {
      const adminMenu = document.querySelector(".list-group.dashboard-menu");
      expect(adminMenu).toBeInTheDocument();
    });
  });

  it("should not display admin details when not authenticated", async () => {
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);

    axios.get.mockResolvedValue({ data: { ok: false } });

    render(
      <MemoryRouter initialEntries={["/dashboard/admin"]}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Admin Name :")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Email :")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Contact :")).not.toBeInTheDocument();
  });

  it("should render Layout component", async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText("Admin Name : Admin User")).toBeInTheDocument();
    });
  });

  it("should display correct data when different mock admin data is passed", async () => {
    const customAdmin = {
      user: {
        name: "Custom Admin",
        email: "customadmin@example.com",
        phone: "1234567890",
      },
    };
    setup(customAdmin);

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
