import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { useNavigate, MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";

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

describe("Login Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders login form", () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		expect(getByText("LOGIN FORM")).toBeInTheDocument();
		expect(getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
		expect(getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
	});
	it("inputs should be initially empty", () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		expect(getByText("LOGIN FORM")).toBeInTheDocument();
		expect(getByPlaceholderText("Enter Your Email").value).toBe("");
		expect(getByPlaceholderText("Enter Your Password").value).toBe("");
	});

	it("should allow typing email and password", () => {
		const { getByText, getByPlaceholderText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);
		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		expect(getByPlaceholderText("Enter Your Email").value).toBe(
			"test@example.com"
		);
		expect(getByPlaceholderText("Enter Your Password").value).toBe(
			"password123"
		);
	});

	it("should login the user successfully", async () => {
		axios.post.mockResolvedValueOnce({
			data: {
				success: true,
				user: { id: 1, name: "John Doe", email: "test@example.com" },
				token: "mockToken",
			},
		});

		const { getByPlaceholderText, getByText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.click(getByText("LOGIN"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(toast.success).toHaveBeenCalledWith(undefined, {
			duration: 5000,
			icon: "🙏",
			style: {
				background: "green",
				color: "white",
			},
		});
	});

	it("should not submit when email is empty", async () => {
		const { getByPlaceholderText, getByText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});

		fireEvent.click(getByText("LOGIN"));

		expect(axios.post).not.toHaveBeenCalled(); // Ensure no API call is made
		expect(toast.error).toHaveBeenCalledWith("Email is required!");
	});

	it("should not submit when password is empty", async () => {
		const { getByPlaceholderText, getByText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "email@valid.com" },
		});

		fireEvent.click(getByText("LOGIN"));

		await waitFor(() => {
			expect(axios.post).not.toHaveBeenCalled(); // Ensure no API call is made
		});

		expect(toast.error).toHaveBeenCalledWith("Password is required!");
	});

	it("should display error for incorrect email password", async () => {
		axios.post.mockRejectedValueOnce({
			response: { data: { message: "Incorrect password or email" } },
		});

		const { getByPlaceholderText, getByText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "wrongpassword" },
		});
		fireEvent.click(getByText("LOGIN"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());

		expect(toast.error).toHaveBeenCalledWith("Incorrect password or email");
	});

	it("should display an error for invalid email format", async () => {
		const { getByPlaceholderText, getByText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "invalid-email" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.click(getByText("LOGIN"));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Please enter a valid email address"
			);
		});

		expect(axios.post).not.toHaveBeenCalled(); // Ensure API is not called for invalid input
	});

	it("should navigate to home page on successful login", async () => {
		const navigate = useNavigate();
		axios.post.mockResolvedValueOnce({
			data: {
				success: true,
				user: { id: 1, name: "John Doe", email: "test@example.com" },
				token: "mockToken",
			},
		});

		const { getByPlaceholderText, getByText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.click(getByText("LOGIN"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());

		expect(navigate).toHaveBeenCalledWith("/");
	});

	it("should navigate to forgot password page when clicked", () => {
		const navigate = useNavigate();

		const { getByText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.click(getByText("Forgot Password"));

		expect(navigate).toHaveBeenCalledWith("/forgot-password");
	});

	it("should display error message on failed login", async () => {
		axios.post.mockRejectedValueOnce({ message: "Invalid credentials" });

		const { getByPlaceholderText, getByText } = render(
			<MemoryRouter initialEntries={["/login"]}>
				<Routes>
					<Route path="/login" element={<Login />} />
				</Routes>
			</MemoryRouter>
		);

		fireEvent.change(getByPlaceholderText("Enter Your Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(getByPlaceholderText("Enter Your Password"), {
			target: { value: "password123" },
		});
		fireEvent.click(getByText("LOGIN"));

		await waitFor(() => expect(axios.post).toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith("Something went wrong");
	});
});
