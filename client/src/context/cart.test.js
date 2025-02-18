import { renderHook, act, waitFor } from "@testing-library/react";

import { CartProvider, useCart } from "./cart";

describe("useCart Hook", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("should initialize with an empty cart", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    expect(result.current[0]).toEqual([]);
  });

  it("should load cart data from localStorage", async () => {
    const mockCart = [{ id: "1", name: "Product 1", quantity: 2 }];
    localStorage.getItem.mockReturnValue(JSON.stringify(mockCart));

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => expect(result.current[0]).toEqual(mockCart));
    expect(localStorage.getItem).toHaveBeenCalledWith("cart");
  });

  it("should update cart state when setCart is called", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    const newCart = [
      { id: "2", name: "Product 2", quantity: 1 },
      { id: "3", name: "Product 3", quantity: 4 },
    ];

    act(() => {
      result.current[1](newCart);
    });

    expect(result.current[0]).toEqual(newCart);
  });
});
