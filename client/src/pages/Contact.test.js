import React from "react";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Contact from "./Contact";

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

describe("Contact Page", () => {
  it("should render Contact page", async () => {
    render(
      <MemoryRouter initialEntries={["/contact"]}>
        <Routes>
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </MemoryRouter>
    );

    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");

    expect(screen.getByText(/CONTACT US/i)).toBeInTheDocument();
    expect(screen.getByTestId("contact-email")).toHaveTextContent(
      "www.help@ecommerceapp.com"
    );

    expect(screen.getByTestId("contact-phone")).toHaveTextContent(
      "012-3456789"
    );

    expect(screen.getByTestId("contact-support")).toHaveTextContent(
      "1800-0000-0000 (toll free)"
    );
  });
});
