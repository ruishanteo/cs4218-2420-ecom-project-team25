import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import Login from "../../../pages/Auth/Login.js";
import HomePage from "../../../pages/HomePage.js";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart.js";
import { SearchProvider } from "../../../context/search.js";

// Create a fake ForgotPassword component
const FakeForgotPassword = () => (
  <div data-testid="forgot-password-page">Forgot Password Page</div>
);

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

// Helper function to render the component with Toast provider and real routing
const renderLoginComponent = (initialEntries = ["/login"]) => {
  return render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <Toaster position="top-center" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<FakeForgotPassword />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("Login Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Clear any lingering toasts between tests
    document.body.innerHTML = "";

    // Clear localStorage before each test
    localStorage.clear();
  });

  it("should render the login form with all fields and buttons", () => {
    renderLoginComponent();

    // Check form title
    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    
    // Check input fields
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
    expect(screen.getByText("Forgot Password")).toBeInTheDocument();
  });

  describe("Field Validation", () => {
    it("should show an error when email is missing", async () => {
      renderLoginComponent();
      
      // Submit without entering any data
      fireEvent.click(screen.getByText("LOGIN"));
      
      expect(toast.error).toHaveBeenCalledWith("Email is required!");
      expect(axios.post).not.toHaveBeenCalled();
    });
    
    it("should show an error when email format is invalid", async () => {
      renderLoginComponent();
      
      // Enter invalid email
      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "invalid-email" },
      });
      
      // Submit form
      fireEvent.click(screen.getByText("LOGIN"));
      
      expect(toast.error).toHaveBeenCalledWith("Please enter a valid email address");
      expect(axios.post).not.toHaveBeenCalled();
    });
    
    it("should show an error when password is missing", async () => {
      renderLoginComponent();
      
      // Enter valid email but no password
      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      
      // Submit form
      fireEvent.click(screen.getByText("LOGIN"));
      
      expect(toast.error).toHaveBeenCalledWith("Password is required!");
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe("Form Submission", () => {
    it("should submit the form with valid data and navigate to home page on success", async () => {
      // Mock successful API response
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      const mockToken = "fake-jwt-token";
      
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Login successful",
          user: mockUser,
          token: mockToken
        },
      });
      
      renderLoginComponent();
      
      // Fill in the required fields
      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
        target: { value: "password123" },
      });
      
      // Submit form
      fireEvent.click(screen.getByText("LOGIN"));
      
      // Wait for the async operations to complete
      await waitFor(() => {
        // Verify API call was made with correct data
        expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
          email: "test@example.com",
          password: "password123",
        });
        
        // Verify success toast was shown
        expect(toast.success).toHaveBeenCalledWith("Login successful", expect.anything());
        
        // Verify auth data was stored in localStorage
        const storedAuth = JSON.parse(localStorage.getItem("auth"));
        expect(storedAuth).toEqual({
          success: true,
          message: "Login successful",
          user: mockUser,
          token: mockToken
        });
        
        // Check for navigation to home page 
        expect(screen.queryByText("LOGIN FORM")).not.toBeInTheDocument();
      });
    });
    
    it("should show error toast when API returns an error message for incorrect credentials", async () => {
      // Mock API response with error message
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: "Incorrect password or email",
        },
      });
      
      renderLoginComponent();
      
      // Fill in the required fields
      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
        target: { value: "wrongpassword" },
      });
      
      // Submit form
      fireEvent.click(screen.getByText("LOGIN"));
      
      // Wait for the async operations to complete
      await waitFor(() => {
        // Verify API call was made
        expect(axios.post).toHaveBeenCalled();
        
        // Verify error toast was shown with the API's error message
        expect(toast.error).toHaveBeenCalledWith("Incorrect password or email");
        
        // Verify remain on login page
        expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
        
        // Verify localStorage was not updated
        expect(localStorage.getItem("auth")).toBeNull();
      });
    });
    
    it("should show generic error toast when API request fails", async () => {
      // Mock API call failure with network error
      axios.post.mockRejectedValueOnce(new Error("Network error"));
      
      renderLoginComponent();
      
      // Fill in the required fields
      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
        target: { value: "password123" },
      });
      
      // Submit form
      fireEvent.click(screen.getByText("LOGIN"));
      
      // Wait for the async operations to complete
      await waitFor(() => {
        // Verify API call was made
        expect(axios.post).toHaveBeenCalled();
        
        // Verify generic error toast was shown
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        
        // Verify remain on login page
        expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
      });
    });
  });
  
  describe("Navigation", () => {
    it("should navigate to forgot password page when clicking the forgot password button", async () => {
      renderLoginComponent();
      
      // Click on the forgot password button
      fireEvent.click(screen.getByText("Forgot Password"));
      
      // Verify navigation to forgot password page
      await waitFor(() => {
        expect(screen.queryByText("LOGIN FORM")).not.toBeInTheDocument();
        expect(screen.getByTestId("forgot-password-page")).toBeInTheDocument();
        expect(screen.getByText("Forgot Password Page")).toBeInTheDocument();
      });
    });
  });
});