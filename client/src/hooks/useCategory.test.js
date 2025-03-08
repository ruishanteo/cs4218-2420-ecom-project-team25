import { renderHook, waitFor, act } from "@testing-library/react";
import axios from "axios";
import useCategory from "./useCategory";

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

  it("should return an empty array and a refresh function by default", () => {
    const { result } = renderHook(() => useCategory());

    expect(result.current[0]).toEqual([]);
    expect(typeof result.current[1]).toBe("function");
  });

  it("should update categories on a successful API call", async () => {
    const mockCategories = [
      { _id: "1", name: "Category 1" },
      { _id: "2", name: "Category 2" },
    ];

    axios.get.mockResolvedValueOnce({
      data: { category: mockCategories, success: true },
    });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current[0]).toEqual(mockCategories);
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("should not update categories and log error when API response is unsuccessful", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false } });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(consoleLogSpy).toHaveBeenCalled());
    expect(result.current[0]).toEqual([]); // The categories should remain empty on failure.
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("should not update categories and log error when API request fails", async () => {
    const mockError = new Error("Failed to fetch categories");
    axios.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useCategory());

    await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(mockError));
    expect(result.current[0]).toEqual([]);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("should refresh categories when refreshCategories is called", async () => {
    const initialCategories = [{ _id: "1", name: "Initial Category" }];
    const updatedCategories = [
      { _id: "2", name: "Updated Category 1" },
      { _id: "3", name: "Updated Category 2" },
    ];
    axios.get
      .mockResolvedValueOnce({
        data: { category: initialCategories, success: true },
      })
      .mockResolvedValueOnce({
        data: { category: updatedCategories, success: true },
      });

    // Initial API call
    const { result } = renderHook(() => useCategory());
    await waitFor(() => {
      expect(result.current[0]).toEqual(initialCategories);
    });

    // Update API call
    act(() => {
      result.current[1](); // call refreshCategories
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual(updatedCategories);
    });
  });
});
