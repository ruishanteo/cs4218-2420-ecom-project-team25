import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/AdminMenu";
import Layout from "./../../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export const PRODUCTS_STRINGS = {
  FETCH_PRODUCTS_ERROR: "Someething went wrong while fetching products",
};

export const API_URLS = {
  GET_PRODUCTS: "/api/v1/product/get-product",
  GET_PHOTO: "/api/v1/product/product-photo",
};

const Products = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const getAllProducts = async () => {
      try {
        const { data } = await axios.get(API_URLS.GET_PRODUCTS);

        if (!data?.success) {
          throw new Error(PRODUCTS_STRINGS.FETCH_PRODUCTS_ERROR);
        }

        setProducts(data.products);
      } catch (error) {
        toast.error(PRODUCTS_STRINGS.FETCH_PRODUCTS_ERROR);
        console.log(error);
      }
    };

    getAllProducts();
  }, []);

  return (
    <Layout>
      <div className="row">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9 ">
          <h1 className="text-center">All Products List</h1>
          <div className="d-flex" data-testid="admin-products-list">
            {products?.map((p, index) => (
              <Link
                key={p._id}
                to={`/dashboard/admin/product/${p.slug}`}
                className="product-link"
              >
                <div
                  className="card m-2"
                  style={{ width: "18rem" }}
                  data-testid={`admin-product-${index}`}
                >
                  <img
                    src={`${API_URLS.GET_PHOTO}/${p._id}`}
                    className="card-img-top"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-text">{p.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
