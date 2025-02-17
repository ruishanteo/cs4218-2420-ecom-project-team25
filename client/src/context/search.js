import React, { useState, useContext, createContext } from "react";

const SearchContext = createContext();
const SearchProvider = ({ children }) => {
  const [value, values] = useState({
    keyword: "",
    results: [],
  });

  return (
    <SearchContext.Provider value={[value, values]}>
      {children}
    </SearchContext.Provider>
  );
};

const useSearch = () => useContext(SearchContext);

export { useSearch, SearchProvider };
