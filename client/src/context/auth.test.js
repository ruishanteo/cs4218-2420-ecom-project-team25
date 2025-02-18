import { renderHook, act, waitFor } from "@testing-library/react";

import { AuthProvider, useAuth } from "./auth";

describe("useAuth Hook", () => {
  beforeAll(() =>
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  );
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("should initialize with default values", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    expect(result.current[0]).toEqual({ user: null, token: "" });
  });

  it("should load auth data from localStorage", async () => {
    const mockAuth = { user: { name: "John Doe" }, token: "12345" };
    localStorage.getItem.mockReturnValue(JSON.stringify(mockAuth));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current[0]).toEqual(mockAuth));
    expect(localStorage.getItem).toHaveBeenCalledWith("auth");
  });

  it("should update auth state and localStorage when setAuth is called", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    const newAuth = { user: { name: "Jane Doe" }, token: "67890" };

    act(() => {
      result.current[1](newAuth);
    });

    expect(result.current[0]).toEqual(newAuth);
  });
});
