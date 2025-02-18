import { renderHook, act } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

describe("useSearch Hook", () => {
  it("should initialize with default search state", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    expect(result.current[0]).toEqual({ keyword: "", results: [] });
  });

  it("should update search state when setValues is called", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    const newSearchState = { keyword: "test", results: ["item1", "item2"] };

    act(() => {
      result.current[1](newSearchState);
    });

    expect(result.current[0]).toEqual(newSearchState);
  });
});
