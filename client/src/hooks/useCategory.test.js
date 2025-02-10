import { renderHook, waitFor } from "@testing-library/react";
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

  it("should return an empty array by default", () => {
    const { result } = renderHook(useCategory);

    expect(result.current).toEqual([]);
  });

  it("should fetch categories successfully", async () => {
    const mockCategories = [
      { _id: "1", name: "Category 1" },
      { _id: "2", name: "Category 2" },
    ];
    axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });

    const { result } = renderHook(useCategory);

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });
    expect(axios.get).toHaveBeenCalled();
  });

  it("should handle API failure gracefully", async () => {
    const mockError = new Error("Failed to fetch categories");
    axios.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(useCategory);

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    });
    expect(axios.get).toHaveBeenCalled();
    expect(result.current).toEqual([]); // Should remain an empty array on failure
  });
});
