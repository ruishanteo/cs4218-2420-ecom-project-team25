import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, useNavigate, useLocation } from "react-router-dom";
import Spinner from "./Spinner";
import "@testing-library/jest-dom";

// Mocking the useNavigate and useLocation hooks from react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe("Spinner Component", () => {
  let navigate;
  let location;

  beforeEach(() => {
    navigate = jest.fn();
    location = { pathname: "/test" };
    useNavigate.mockReturnValue(navigate);
    useLocation.mockReturnValue(location);
  });

  it("should render countdown and spinner", () => {
    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );

    expect(screen.getByText(/redirecting to you in/i)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/second/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should decrease the countdown every second", () => {
    jest.useFakeTimers();

    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );

    // Fast-forward by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // After 1 second, count should be 2
    expect(screen.getByText(/redirecting to you in/i)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/second/i)).toBeInTheDocument();

    // Fast-forward by another second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // After 2 seconds, count should be 1
    expect(screen.getByText(/redirecting to you in/i)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/second/i)).toBeInTheDocument();

    // Fast-forward by another second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // After 3 seconds, count should be 0
    expect(screen.getByText(/redirecting to you in/i)).toBeInTheDocument();
    expect(screen.getByText(/0/)).toBeInTheDocument();
    expect(screen.getByText(/second/i)).toBeInTheDocument();
  });

  it("should redirect when countdown reaches 0", () => {
    jest.useFakeTimers();

    render(
      <MemoryRouter>
        <Spinner />
      </MemoryRouter>
    );

    // Fast-forward by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // After 3 seconds, the navigate function should be called with the correct path
    expect(navigate).toHaveBeenCalledWith("/login", {
      state: "/test",
    });
  });

  it("should redirect to a custom path", () => {
    jest.useFakeTimers();

    render(
      <MemoryRouter>
        <Spinner path="register" />
      </MemoryRouter>
    );

    // Fast-forward by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // After 3 seconds, the navigate function should be called with the custom path
    expect(navigate).toHaveBeenCalledWith("/register", {
      state: "/test",
    });
  });
});
