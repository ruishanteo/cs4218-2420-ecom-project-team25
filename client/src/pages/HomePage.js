import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, Radio } from "antd";
import { Prices } from "../components/Prices";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "./../components/Layout";
import { AiOutlineReload } from "react-icons/ai";
import Spinner from "../components/Spinner";
import "../styles/Homepages.css";
import useCategory from "../hooks/useCategory";

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [checked, setChecked] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const [productLoading, setProductLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [categories] = useCategory();

  useEffect(() => {
    let isValid = true;
    const getAllProducts = async () => {
      try {
        setProductLoading(true);
        const { data } = await axios.get("/api/v1/product/product-list", {
          params: {
            page: 1,
            minPrice: minPrice,
            maxPrice: maxPrice,
            categories: checked.join(","),
          },
        });
        if (!isValid) {
          return;
        }

        setProducts(data.products);
        setHasMore(data.hasMore);
      } catch (error) {
        console.log(error);
        toast.error("Error in getting products");
      }
      setProductLoading(false);
    };

    getAllProducts();

    return () => {
      isValid = false;
    };
  }, [minPrice, maxPrice, checked]);

  //load more
  const loadMore = async () => {
    try {
      setLoadMoreLoading(true);
      const { data } = await axios.get("/api/v1/product/product-list", {
        params: {
          page: page + 1,
          minPrice: minPrice,
          maxPrice: maxPrice,
          categories: checked.join(","),
        },
      });

      setProducts([...products, ...data?.products]);
      setHasMore(data.hasMore);
      setPage(page + 1);
    } catch (error) {
      toast.error("Error in getting more products");
      console.log(error);
    }
    setLoadMoreLoading(false);
  };

  // filter by cat
  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
    setChecked(all);
    setPage(1);
  };

  return (
    <Layout title={"ALL Products - Best offers "}>
      {/* banner image */}
      <img
        src="/images/Virtual.png"
        className="banner-img"
        alt="bannerimage"
        width={"100%"}
      />
      {/* banner image */}
      <div className="container-fluid row mt-3 home-page">
        <div className="col-md-3 filters">
          <h4 className="text-center">Filter By Category</h4>
          <div className="d-flex flex-column">
            {categories?.map((c) => (
              <Checkbox
                key={c._id}
                data-testid={`${c._id}-category-checkbox`}
                onChange={(e) => handleFilter(e.target.checked, c._id)}
              >
                {c.name}
              </Checkbox>
            ))}
          </div>
          {/* price filter */}
          <h4 className="text-center mt-4">Filter By Price</h4>
          <div className="d-flex flex-column">
            <Radio.Group
              onChange={(e) => {
                setMinPrice(e.target.value[0]);
                setMaxPrice(e.target.value[1]);
                setPage(1);
              }}
            >
              {Prices?.map((p) => (
                <div key={p._id}>
                  <Radio value={p.array}>{p.name}</Radio>
                </div>
              ))}
            </Radio.Group>
          </div>
          <div className="d-flex flex-column">
            <button
              className="btn btn-danger"
              onClick={() => window.location.reload()}
            >
              RESET FILTERS
            </button>
          </div>
        </div>
        <div className="col-md-9 ">
          <h1 className="text-center">All Products</h1>

          {productLoading ? (
            <Spinner />
          ) : products?.length === 0 ? (
            <p>No Product Found</p>
          ) : (
            <div className="d-flex flex-wrap">
              {products?.map((p) => (
                <div className="card m-2" key={p._id}>
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <div className="card-name-price">
                      <h5 className="card-title">{p.name}</h5>
                      <h5 className="card-title card-price">
                        {p.price.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </h5>
                    </div>
                    <p className="card-text ">
                      {p.description.substring(0, 60)}...
                    </p>
                    <div className="card-name-price">
                      <button
                        className="btn btn-info ms-1"
                        data-testid={`${p._id}-more-details-btn`}
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        More Details
                      </button>
                      <button
                        className="btn btn-dark ms-1"
                        data-testid={`${p._id}-add-to-cart-btn`}
                        onClick={() => {
                          setCart([...cart, p]);
                          localStorage.setItem(
                            "cart",
                            JSON.stringify([...cart, p])
                          );
                          toast.success("Item Added to cart");
                        }}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="m-2 p-3">
            {products && hasMore && (
              <button
                className="btn loadmore"
                onClick={(e) => {
                  e.preventDefault();
                  loadMore();
                }}
              >
                {loadMoreLoading ? (
                  "Loading ..."
                ) : (
                  <>
                    {" "}
                    Loadmore <AiOutlineReload />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
