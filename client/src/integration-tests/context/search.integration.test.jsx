import React from "react";
import { prettyDOM, render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SearchProvider, useSearch } from "../../context/search";

// Test Component to consume search context
const TestComponent = () => {
  const [{ keyword, results }, setSearch] = useSearch();

  const handleSearch = () => {
    setSearch((prev) => ({
      ...prev,
      keyword: "test",
      results: ["result 1", "result 2"],
    }));
  };

  return (
    <div>
      <button onClick={handleSearch}>Search</button>
      <p>{keyword}</p>
      <ul>
        {results.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ul>
    </div>
  );
};

// Integration test for the SearchContext
describe("Search context Integration Test", () => {
  test("should update the keyword and results when search button is clicked", () => {
    const { container } = render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );

    console.log("Rendered DOM:", prettyDOM(container));

    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(searchButton).toBeInTheDocument();

    // Initial state should be empty
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    // Simulate search button click
    fireEvent.click(searchButton);

    // After clicking, keyword and results should update
    expect(screen.getByText("test")).toBeInTheDocument();
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
    expect(screen.getByText("result 1")).toBeInTheDocument();
    expect(screen.getByText("result 2")).toBeInTheDocument();
  });
});
