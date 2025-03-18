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

jest.spyOn(toast, "success");
jest.mock("axios");
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

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue(
      [
        {
          user: mockUser,
        },
      ],
      jest.fn()
    );
  });

  it("should render the right layour component", async () => {
    setup();
    await waitFor(() => {
      expect(document.title).toBe("Your Profile");
    });
  });

  it("should render user menu", async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });
  });

  it("should render user's name in dropdown", async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "John Doe" })
      ).toBeInTheDocument();
    });
  });

  //   it("should submit profile form successfully", async () => {
  //     const updatedUser = {
  //       name: "John Doeee",
  //       email: "john@gmail.com",
  //       address: "NTU, Singapore",
  //       phone: "123456789100",
  //     };
  //     axios.put.mockResolvedValue({ data: { error: null, updatedUser } });

  //     setup();

  //     await act(async () => {
  //       await user.type(
  //         screen.getByPlaceholderText("Enter Your Name"),
  //         updatedUser.name
  //       );
  //       await user.type(
  //         screen.getByPlaceholderText("Enter Your Password"),
  //         "newpassword"
  //       );
  //       await user.type(
  //         screen.getByPlaceholderText("Enter Your Phone"),
  //         updatedUser.phone
  //       );
  //       await user.type(
  //         screen.getByPlaceholderText("Enter Your Address"),
  //         updatedUser.address
  //       );
  //     });

  //     fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

  //     await waitFor(() => {
  //       expect(axios.put).toHaveBeenCalled();
  //     });
  //   });
});
