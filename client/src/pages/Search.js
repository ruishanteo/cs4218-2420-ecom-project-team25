import React from "react";
import Layout from "./../components/Layout";

import { useSearch } from "../context/search";

const Search = () => {
  const [values] = useSearch();

  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="text-center">
          <h1>Search Resuts</h1>
          <h6
            data-testid={
              values?.results.length < 1
                ? "search-no-results"
                : "search-results"
            }
          >
            {values?.results.length < 1
              ? "No Products Found"
              : `Found ${values?.results.length}`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {values?.results.map((p) => (
              <div
                key={p._id}
                className="card m-2"
                style={{ width: "18rem" }}
                data-testid={`search-product-${p._id}`}
              >
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body">
                  <h5
                    className="card-title"
                    data-testid={`product-name-${p._id}`}
                  >
                    {p.name}
                  </h5>
                  <p
                    className="card-text"
                    data-testid={`product-truncated-desc-${p._id}`}
                  >
                    {p.description.substring(0, 30)}...
                  </p>
                  <p
                    className="card-text"
                    data-testid={`product-price-${p._id}`}
                  >
                    {" "}
                    $ {p.price}
                  </p>
                  <button className="btn btn-primary ms-1">More Details</button>
                  <button className="btn btn-secondary ms-1">
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
