import { renderHook, waitFor, act } from "@testing-library/react";
import axios from "axios";

import useCategory, { USE_CATEGORY_STRINGS } from "./useCategory";

jest.mock("axios");

describe("useCategory Hook", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should return an empty array by default", () => {
    const { result } = renderHook(() => useCategory());

    expect(result.current[0]).toEqual([]); // categories should be an empty array
    expect(typeof result.current[1]).toBe("function"); // refreshCategories should be a function
  });

  it("should fetch categories successfully", async () => {
    const mockCategories = [
      { _id: "1", name: "Category 1" },
      { _id: "2", name: "Category 2" },
    ];
    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    }); // Simulate a successful API call

    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(result.current[0]).toEqual(mockCategories));

    expect(axios.get).toHaveBeenCalledTimes(1); // API should be called on mount
  });

  it("should handle API failure gracefully", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false } }); // Simulate API failure

    const { result } = renderHook(() => useCategory());

    await waitFor(() =>
      expect(consoleLogSpy).toHaveBeenCalledWith(
        new Error(USE_CATEGORY_STRINGS.ERROR)
      )
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toEqual([]); // Should remain an empty array on failure
  });

  it("should handle exception thrown gracefully", async () => {
    const mockError = new Error("Failed to fetch categories");
    axios.get.mockRejectedValueOnce(mockError); // Simulate an exception

    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(mockError));

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toEqual([]); // Should remain an empty array on failure
  });

  it("should refresh categories when refreshCategories is called", async () => {
    const initialCategories = [{ _id: "1", name: "Initial Category" }];
    const updatedCategories = [
      { _id: "2", name: "Updated Category 1" },
      { _id: "3", name: "Updated Category 2" },
    ];

    axios.get.mockResolvedValueOnce({
      data: { category: initialCategories, success: true },
    });

    // result is an array with two values: [categories, refreshCategories]
    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(result.current[0]).toEqual(initialCategories));

    axios.get.mockResolvedValueOnce({
      data: { category: updatedCategories, success: true },
    });

    act(() => {
      result.current[1]();
    });

    await waitFor(() => expect(result.current[0]).toEqual(updatedCategories));

    expect(axios.get).toHaveBeenCalledTimes(2); // API should be called twice (initial + refresh)
  });
});
