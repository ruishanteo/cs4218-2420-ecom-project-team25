import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import Register from "../../../pages/Auth/Register.js";
import Login from "../../../pages/Auth/Login.js";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart.js";
import { SearchProvider } from "../../../context/search.js";

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
const renderRegisterComponent = () => {
	return render(
		<AuthProvider>
			<CartProvider>
				<SearchProvider>
					<MemoryRouter initialEntries={["/register"]}>
						<Toaster position="top-center" />
						<Routes>
							<Route path="/register" element={<Register />} />
							<Route path="/login" element={<Login />} />
						</Routes>
					</MemoryRouter>
				</SearchProvider>
			</CartProvider>
		</AuthProvider>
	);
};

describe("Register Component", () => {
	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();

		// Clear any lingering toasts between tests
		document.body.innerHTML = "";
	});

	it("should render the register form with all fields", () => {
		renderRegisterComponent();

		expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Enter Your Name")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Enter Your Password")
		).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Enter Your Phone")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Enter Your Address")
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("What is Your Favorite Sport")
		).toBeInTheDocument();
		expect(screen.getByText("REGISTER")).toBeInTheDocument();
	});

	describe("Field Validation", () => {
        it("should show an error when name is missing", async () => {
            renderRegisterComponent();
        
            fireEvent.click(screen.getByText("REGISTER"));
        
            expect(toast.error).toHaveBeenCalledWith("Name is required!");
            expect(axios.post).not.toHaveBeenCalled();
        });
        
        it("should show an error when email is missing", async () => {
            renderRegisterComponent();
        
            fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
                target: { value: "Test User" },
            });
        
            fireEvent.click(screen.getByText("REGISTER"));
        
            expect(toast.error).toHaveBeenCalledWith("Email is required!");
            expect(axios.post).not.toHaveBeenCalled();
        });
        
        it("should show an error when password is missing", async () => {
            renderRegisterComponent();
        
            fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
                target: { value: "Test User" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
                target: { value: "test@example.com" },
            });
        
            fireEvent.click(screen.getByText("REGISTER"));
        
            expect(toast.error).toHaveBeenCalledWith("Password is required!");
            expect(axios.post).not.toHaveBeenCalled();
        });
        
        it("should show an error when phone is missing", async () => {
            renderRegisterComponent();
        
            fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
                target: { value: "Test User" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
                target: { value: "test@example.com" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
                target: { value: "password123" },
            });
        
            fireEvent.click(screen.getByText("REGISTER"));
        
            expect(toast.error).toHaveBeenCalledWith("Phone is required!");
            expect(axios.post).not.toHaveBeenCalled();
        });
        
        it("should show an error when address is missing", async () => {
            renderRegisterComponent();
        
            fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
                target: { value: "Test User" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
                target: { value: "test@example.com" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
                target: { value: "password123" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
                target: { value: "1234567890" },
            });
        
            fireEvent.click(screen.getByText("REGISTER"));
        
            expect(toast.error).toHaveBeenCalledWith("Address is required!");
            expect(axios.post).not.toHaveBeenCalled();
        });
        
        it("should show an error when date of birth is missing", async () => {
            renderRegisterComponent();
        
            fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
                target: { value: "Test User" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
                target: { value: "test@example.com" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
                target: { value: "password123" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
                target: { value: "1234567890" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
                target: { value: "123 Main St" },
            });
        
            fireEvent.click(screen.getByText("REGISTER"));
        
            expect(toast.error).toHaveBeenCalledWith("Date of Birth is required!");
            expect(axios.post).not.toHaveBeenCalled();
        });
        
        it("should show an error when security answer is missing", async () => {
            renderRegisterComponent();
        
            fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
                target: { value: "Test User" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
                target: { value: "test@example.com" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
                target: { value: "password123" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
                target: { value: "1234567890" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
                target: { value: "123 Main St" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
                target: { value: "2000-01-01" },
            });
        
            fireEvent.click(screen.getByText("REGISTER"));
        
            expect(toast.error).toHaveBeenCalledWith("Answer is required!");
            expect(axios.post).not.toHaveBeenCalled();
        });
        

        it("should show error toast when email is invalid", async () => {
            renderRegisterComponent();
    
            // Fill name but invalid email
            fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
                target: { value: "Test User" },
            });
            fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
                target: { value: "invalid-email" },
            });
    
            // Submit form
            fireEvent.click(screen.getByText("REGISTER"));
    
            // Wait for the toast to appear
            expect(toast.error).toHaveBeenCalledWith("Please enter a valid email address");
    
            expect(axios.post).not.toHaveBeenCalled();
        });
    
	});

	describe("Form Submission", () => {
		it("should submit the form with valid data and navigate to login page on success", async () => {
			// Mock successful API response
			axios.post.mockResolvedValueOnce({
				data: {
					success: true,
					message: "User registered successfully",
				},
			});

			renderRegisterComponent();

			// Fill in all the required fields
			fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
				target: { value: "Test User" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
				target: { value: "password123" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
				target: { value: "1234567890" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
				target: { value: "123 Main St" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
				target: { value: "2000-01-01" },
			});
			fireEvent.change(
				screen.getByPlaceholderText("What is Your Favorite Sport"),
				{ target: { value: "Football" } }
			);

			// Submit form
			fireEvent.click(screen.getByText("REGISTER"));

			// Wait for the async operations to complete
			await waitFor(() => {
				// Verify API call was made with correct data
				expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
					name: "Test User",
					email: "test@example.com",
					password: "password123",
					phone: "1234567890",
					address: "123 Main St",
					DOB: "2000-01-01",
					answer: "Football",
				});

				// Verify success toast was shown
                expect(toast.success).toHaveBeenCalledWith("Register Successfully, please login");	
                expect(screen.queryByText("REGISTER FORM")).not.toBeInTheDocument();
                expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
            });
		});

		it("should show error toast when API returns an error message", async () => {
			// Mock API response with error message
			axios.post.mockResolvedValueOnce({
				data: {
					success: false,
					message: "Email already exists",
				},
			});

			renderRegisterComponent();

			// Fill in all the required fields
			fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
				target: { value: "Test User" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
				target: { value: "password123" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
				target: { value: "1234567890" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
				target: { value: "123 Main St" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
				target: { value: "2000-01-01" },
			});
			fireEvent.change(
				screen.getByPlaceholderText("What is Your Favorite Sport"),
				{ target: { value: "Football" } }
			);

			// Submit form
			fireEvent.click(screen.getByText("REGISTER"));

			// Wait for the async operations to complete
			await waitFor(() => {
				// Verify API call was made
				expect(axios.post).toHaveBeenCalled();

				// Verify error toast was shown with the API's error message
                expect(toast.error).toHaveBeenCalledWith("Email already exists");	

				// Verify remain on register page
				expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
			});
		});

		it("should show generic error toast when API request fails", async () => {
			// Mock API call failure
			axios.post.mockRejectedValueOnce(new Error("Network error"));

			renderRegisterComponent();

			// Fill in all the required fields
			fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
				target: { value: "Test User" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
				target: { value: "test@example.com" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
				target: { value: "password123" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
				target: { value: "1234567890" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
				target: { value: "123 Main St" },
			});
			fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
				target: { value: "2000-01-01" },
			});
			fireEvent.change(
				screen.getByPlaceholderText("What is Your Favorite Sport"),
				{ target: { value: "Football" } }
			);

			// Submit form
			fireEvent.click(screen.getByText("REGISTER"));

			// Wait for the async operations to complete
			await waitFor(() => {
				// Verify API call was made
				expect(axios.post).toHaveBeenCalled();

				// Verify generic error toast was shown
                expect(toast.error).toHaveBeenCalledWith("Something went wrong");	
                
				// Verify remain on register page
				expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
			});
		});
	});
});
