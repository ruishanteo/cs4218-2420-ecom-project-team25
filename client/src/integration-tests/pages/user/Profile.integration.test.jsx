import "@testing-library/jest-dom";
import axios from "axios";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../../context/auth";
import PrivateRoute from "../../../components/Routes/Private";
import {
  render,
  waitFor,
  screen,
  act,
  fireEvent,
} from "@testing-library/react";
import Profile from "../../../pages/user/Profile";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

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

describe("Profile Integration Tests", () => {
  const user = userEvent.setup();

  const mockUser = {
    name: "John Doe",
    email: "john@gmail.com",
    address: "NUS, Singapore",
    phone: "1234567890",
  };

  const setup = () => {
    return render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
          <Routes>
            {/* integrate with private route as it is its parent */}
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route path="user/profile" element={<Profile />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Providers>
    );
  };

  const setAuthInLocalStorage = (authData) => {
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setAuthInLocalStorage({ user: mockUser, token: "valid-token" });

    axios.get.mockImplementation((url) => {
      // mock user-auth api to return ok for privateroute
      if (url === "/api/v1/auth/user-auth") {
        return Promise.resolve({ data: { ok: true } });
      }
    });

    axios.put.mockImplementation((url) => {
      if (url === "/api/v1/auth/profile") {
        return Promise.resolve({
          data: { error: null, updatedUser: mockUser },
        });
      }
    });
  });

  it("should display correct user details", async () => {
    setup();

    await waitFor(() => {
      expect(document.title).toBe("Your Profile");
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "John Doe" })
      ).toBeInTheDocument();
    });

    // wait for the form to be populated
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Name").value).toBe(
        mockUser.name
      );
    });

    expect(screen.getByPlaceholderText("Enter Your Email").value).toEqual(
      mockUser.email
    );
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toEqual(
      mockUser.phone
    );
    expect(screen.getByPlaceholderText("Enter Your Address").value).toEqual(
      mockUser.address
    );
  });

  it("should submit form successfully and update form when user updates profile", async () => {
    const updatedUser = {
      name: "John Doeee",
      email: "john@gmail.com",
      address: "NTU, Singapore",
      phone: "123456789100",
    };
    setup();

    // wait for form to appear
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Enter Your Name")
      ).toBeInTheDocument();
    });

    // simulate user typing in the input fields
    // must clear the input field before typing
    await act(async () => {
      await user.click(screen.getByPlaceholderText("Enter Your Name"));

      await user.clear(screen.getByPlaceholderText("Enter Your Name"));
      await user.type(
        screen.getByPlaceholderText("Enter Your Name"),
        updatedUser.name
      );

      await user.type(
        screen.getByPlaceholderText("Enter Your Password"),
        "newpassword"
      );

      await user.clear(screen.getByPlaceholderText("Enter Your Phone"));
      await user.type(
        screen.getByPlaceholderText("Enter Your Phone"),
        updatedUser.phone
      );

      await user.clear(screen.getByPlaceholderText("Enter Your Address"));
      await user.type(
        screen.getByPlaceholderText("Enter Your Address"),
        updatedUser.address
      );
    });

    // fire event submmision of button
    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Profile Updated Successfully"
      );
    });
    // check that form inputs are updated
    expect(screen.getByPlaceholderText("Enter Your Name").value).toEqual(
      updatedUser.name
    );
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toEqual(
      updatedUser.phone
    );
    expect(screen.getByPlaceholderText("Enter Your Address").value).toEqual(
      updatedUser.address
    );
    expect(screen.getByPlaceholderText("Enter Your Email").value).toEqual(
      mockUser.email
    );
  });

  it("should handle failure in update field", async () => {
    axios.put.mockImplementation(() => {
      return Promise.reject({
        response: {
          status: 400,
          data: {
            message: "Password should be minimum 6 characters long",
            success: false,
          },
        },
      });
    });

    setup();

    // wait for form to appear
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Enter Your Password")
      ).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByPlaceholderText("Enter Your Password"));

      await user.type(
        screen.getByPlaceholderText("Enter Your Password"),
        "pass"
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password should be minimum 6 characters long"
      );
    });
  });

  it("should handle error gracefully when error is thrown", async () => {
    axios.put.mockImplementation(() => {
      return Promise.reject(new Error("Error updating profile"));
    });

    setup();

    // wait for form to appear
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Enter Your Password")
      ).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByPlaceholderText("Enter Your Password"));

      await user.type(
        screen.getByPlaceholderText("Enter Your Password"),
        "pass"
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("should redirect user to login page if user is not signed in", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/user-auth") {
        return Promise.resolve({ data: { ok: false } }); // simulate user not signed in in privateroute
      }
    });

    setup();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /redirecting to you in/i })
      ).toBeInTheDocument();
    });
  });
});
