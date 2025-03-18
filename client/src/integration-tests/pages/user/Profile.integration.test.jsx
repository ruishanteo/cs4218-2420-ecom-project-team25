import "@testing-library/jest-dom";
import axios from "axios";
import { useAuth } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
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

// integration tests:
// - should perform actions a user would do. For example: to change the state of a component, a click event would be fired.
// - should be kept minimal
// - always test behaviour and not implementation

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

jest.mock("../../../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../../../context/auth", () => ({
  useAuth: jest.fn(),
}));

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
    <CartProvider>
      <SearchProvider>{children}</SearchProvider>
    </CartProvider>
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
        <MemoryRouter initialEntries={["/user/profile"]}>
          <Routes>
            <Route path="/user/profile" element={<Profile />} />
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

    useAuth.mockReturnValue([
      {
        user: mockUser,
      },
      jest.fn(),
    ]);
  });

  it("should display correct user details", async () => {
    setAuthInLocalStorage({ user: mockUser, token: "valid-token" });
    setup();

    await waitFor(() => {
      expect(document.title).toBe("Your Profile");
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "John Doe" })
      ).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Enter Your Name").value).toEqual(
      mockUser.name
    );
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

  it("should submit form successfully when user updates profile", async () => {
    setAuthInLocalStorage({ user: mockUser, token: "valid-token" });
    const updatedUser = {
      name: "John Doeee",
      email: "john@gmail.com",
      address: "NTU, Singapore",
      phone: "123456789100",
    };
    axios.put.mockResolvedValue({ data: { error: null, updatedUser } });

    setup();

    // simulate user typing in the input fields
    // must clear the input field before typing
    await act(async () => {
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

  it("should show error on api error", async () => {
    setAuthInLocalStorage({ user: mockUser, token: "valid-token" });

    axios.put.mockResolvedValueOnce({
      data: { error: "API error", updatedUser: null },
    });

    setup();

    // simulate user typing in the input fields
    // must clear the input field before typing
    await act(async () => {
      await user.clear(screen.getByPlaceholderText("Enter Your Name"));
      await user.type(
        screen.getByPlaceholderText("Enter Your Name"),
        "John Doeee"
      );
    });

    // fire event submmision of button
    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("API error");
    });
  });

  it("should show error on server error", async () => {
    setAuthInLocalStorage({ user: mockUser, token: "valid-token" });
    // axios put throw error
    axios.put.mockRejectedValueOnce(new Error("Server error"));

    setup();

    // simulate user typing in the input fields
    // must clear the input field before typing
    await act(async () => {
      await user.clear(screen.getByPlaceholderText("Enter Your Name"));
      await user.type(
        screen.getByPlaceholderText("Enter Your Name"),
        "John Doeee"
      );
    });

    // fire event submmision of button
    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
