import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { useNavigate, MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Register from "./Register";

const mockedUsedNavigate = jest.fn();

// Mocking axios.post
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
	useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../context/cart", () => ({
	useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
	useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: () => mockedUsedNavigate,
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

Object.defineProperty(window, "localStorage", {
	value: {
		setItem: jest.fn(),
		getItem: jest.fn(),
		removeItem: jest.fn(),
	},
	writable: true,
});

window.matchMedia =
	window.matchMedia ||
	function () {
		return {
			matches: false,
			addListener: function () {},
			removeListener: function () {},
		};
	};

describe("Register Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should navigate to login after successful registration", async () => {
		const navigate = useNavigate();
		axios.post.mockResolvedValueOnce({ data: { success: true } });

		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
					<Route path="/login" element={<div>Login Page</div>} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "1234567890" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Address"), {
			target: { value: "123 Street" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
			target: { value: "2000-01-01" },
		});
		fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
			target: { value: "Football" },
		});

		fireEvent.click(getByText("REGISTER"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());

		expect(navigate).toHaveBeenCalledWith("/login");
	});

	it("should register the user successfully", async () => {
		axios.post.mockResolvedValueOnce({ data: { success: true } });

		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);
		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "1234567890" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Address"), {
			target: { value: "123 Street" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
			target: { value: "2000-01-01" },
		});
		fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
			target: { value: "Football" },
		});

		fireEvent.click(getByText("REGISTER"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(toast.success).toHaveBeenCalledWith(
			"Register Successfully, please login"
		);
	});

	it("should display error message on failed registration", async () => {
		axios.post.mockRejectedValueOnce({ message: "User already exists" });

		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "1234567890" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Address"), {
			target: { value: "123 Street" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
			target: { value: "2000-01-01" },
		});
		fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
			target: { value: "Football" },
		});

		fireEvent.click(getByText("REGISTER"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith("Something went wrong");
	});
	it("should show error when name is empty", async () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "" },
		});
		fireEvent.click(getByText("REGISTER"));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Name is required!")
		);
	});

	it("should show error when email is empty", async () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "" },
		});
		fireEvent.click(getByText("REGISTER"));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Email is required!")
		);
	});

	it("should show error when password is empty", async () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "" },
		});
		fireEvent.click(getByText("REGISTER"));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Password is required!")
		);
	});

	it("should show error when phone is empty", async () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "" },
		});
		fireEvent.click(getByText("REGISTER"));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Phone is required!")
		);
	});

	it("should show error when address is empty", async () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "1234567890" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Address"), {
			target: { value: "" },
		});
		fireEvent.click(getByText("REGISTER"));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Address is required!")
		);
	});

	it("should show error when DOB is empty", async () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "1234567890" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Address"), {
			target: { value: "123 Street" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
			target: { value: "" },
		});
		fireEvent.click(getByText("REGISTER"));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Date of Birth is required!")
		);
	});

	it("should show error when answer is empty", async () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "1234567890" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Address"), {
			target: { value: "123 Street" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
			target: { value: "2000-01-01" },
		});
		fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
			target: { value: "" },
		});
		fireEvent.click(getByText("REGISTER"));

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Answer is required!")
		);
	});

	it("should show error on invalid email format", async () => {
		axios.post.mockRejectedValueOnce({ message: "Invalid email format" });

		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "invalidemail" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "1234567890" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Address"), {
			target: { value: "123 Street" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
			target: { value: "2000-01-01" },
		});
		fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
			target: { value: "Football" },
		});

		fireEvent.click(getByText("REGISTER"));

		await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith(
			"Please enter a valid email address"
		);
	});

	it("should handle server error gracefully", async () => {
		axios.post.mockRejectedValueOnce(new Error("Internal Server Error"));

		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/register"]}>
				<Routes>
					<Route path="/register" element={<Register />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Name"), {
			target: { value: "John Doe" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
			target: { value: "1234567890" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Address"), {
			target: { value: "123 Street" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
			target: { value: "2000-01-01" },
		});
		fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
			target: { value: "Football" },
		});

		fireEvent.click(getByText("REGISTER"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith("Something went wrong");
	});
});
