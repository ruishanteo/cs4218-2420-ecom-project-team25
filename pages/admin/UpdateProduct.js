import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import useCategory from "../../hooks/useCategory";
const { Option } = Select;

export const UPDATE_PRODUCT_STRINGS = {
  UPDATE_PRODUCT_ACTION: "UPDATE PRODUCT",
  DELETE_PRODUCT_ACTION: "DELETE PRODUCT",
  SELECT_CATEGORY_ACTION: "Product category",
  UPLOAD_PHOTO_ACTION: "Upload Photo",
  SELECT_SHIPPING_ACTION: "Product shipping",
  SELECT_SHIPPING_YES_ACTION: "Yes",
  SELECT_SHIPPING_NO_ACTION: "No",
  DELETE_PRODUCT_CONFIRM:
    "Delete Product? Enter any key to confirm. This action is irreversible.",

  PRODUCT_NAME_PLACEHOLDER: "Product name",
  PRODUCT_DESCRIPTION_PLACEHOLDER: "Product description",
  PRODUCT_PRICE_PLACEHOLDER: "Product price",
  PRODUCT_QUANTITY_PLACEHOLDER: "Product quantity",
  PHOTO_PLACEHODER: "Product photo",

  FETCH_PRODUCT_ERROR: "Something went wrong in getting product",
  UPDATE_PRODUCT_ERROR: "Something went wrong in updating product",
  DELETE_PRODUCT_ERROR: "Something went wrong in deleting product",

  PRODUCT_UPDATED: "Product updated successfully",
  PRODUCT_DELETED: "Product deleted successfully",
};

export const API_URLS = {
  GET_PRODUCT: "/api/v1/product/get-product",
  UPDATE_PRODUCT: "/api/v1/product/update-product",
  DELETE_PRODUCT: "/api/v1/product/delete-product",
  GET_PRODUCT_PHOTO: "/api/v1/product/product-photo",
};

const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [categories] = useCategory();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState("");
  const [photo, setPhoto] = useState("");
  const [id, setId] = useState("");

  // Fetch single product on component mount or when slug changes
  useEffect(() => {
    const getSingleProduct = async () => {
      try {
        const { data } = await axios.get(
          `${API_URLS.GET_PRODUCT}/${params.slug}`
        );

        if (!data?.success) {
          throw new Error(UPDATE_PRODUCT_STRINGS.FETCH_PRODUCT_ERROR);
        }

        setName(data.product.name);
        setId(data.product._id);
        setDescription(data.product.description);
        setPrice(data.product.price);
        setQuantity(data.product.quantity);
        setShipping(data.product.shipping);
        setCategory(data.product.category._id);
      } catch (error) {
        toast.error(UPDATE_PRODUCT_STRINGS.FETCH_PRODUCT_ERROR);
        console.log(error);
      }
    };

    getSingleProduct();
  }, [params.slug]);

  // Create product function
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const productData = new FormData();
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("quantity", quantity);
      photo && productData.append("photo", photo);
      productData.append("category", category);
      productData.append("shipping", shipping);

      const { data } = await axios.put(
        `${API_URLS.UPDATE_PRODUCT}/${id}`,
        productData
      );

      if (!data?.success) {
        throw new Error(UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ERROR);
      }

      toast.success(UPDATE_PRODUCT_STRINGS.PRODUCT_UPDATED);
      navigate("/dashboard/admin/products");
    } catch (error) {
      toast.error(UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ERROR);
      console.log(error);
    }
  };

  // Delete product function
  const handleDelete = async () => {
    try {
      const answer = window.prompt(
        UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_CONFIRM
      );
      if (!answer) return;

      const { data } = await axios.delete(`${API_URLS.DELETE_PRODUCT}/${id}`);

      if (!data?.success) {
        throw new Error(UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ERROR);
      }

      toast.success(UPDATE_PRODUCT_STRINGS.PRODUCT_DELETED);
      navigate("/dashboard/admin/products");
    } catch (error) {
      toast.error(UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ERROR);
      console.log(error);
    }
  };

  return (
    <Layout title={"Dashboard - Create Product"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Update Product</h1>
            <div className="m-1 w-75">
              <Select
                variant="borderless"
                placeholder={UPDATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION}
                aria-label={UPDATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION}
                size="large"
                showSearch
                className="form-select mb-3"
                onChange={(value) => {
                  setCategory(value);
                }}
                value={category}
              >
                {categories?.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
              <div className="mb-3">
                <label
                  className="btn btn-outline-secondary col-md-12"
                  htmlFor="upload-photo"
                >
                  {photo
                    ? photo.name
                    : UPDATE_PRODUCT_STRINGS.UPLOAD_PHOTO_ACTION}
                </label>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  aria-label={UPDATE_PRODUCT_STRINGS.UPLOAD_PHOTO_ACTION}
                  id="upload-photo"
                  hidden
                />
              </div>
              <div className="mb-3">
                {photo ? (
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={UPDATE_PRODUCT_STRINGS.PHOTO_PLACEHODER}
                      height={"200px"}
                      className="img img-responsive"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <img
                      src={`${
                        API_URLS.GET_PRODUCT_PHOTO
                      }/${id}?id=${Date.now()}`}
                      alt={UPDATE_PRODUCT_STRINGS.PHOTO_PLACEHODER}
                      height={"200px"}
                      className="img img-responsive"
                    />
                  </div>
                )}
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={name}
                  aria-label={UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER}
                  placeholder={UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER}
                  className="form-control"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <textarea
                  type="text"
                  value={description}
                  aria-label={
                    UPDATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
                  }
                  placeholder={
                    UPDATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
                  }
                  className="form-control"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <input
                  type="number"
                  value={price}
                  aria-label={UPDATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER}
                  placeholder={UPDATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER}
                  className="form-control"
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="number"
                  value={quantity}
                  aria-label={
                    UPDATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
                  }
                  placeholder={
                    UPDATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
                  }
                  className="form-control"
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <Select
                  variant="borderless"
                  aria-label={UPDATE_PRODUCT_STRINGS.SELECT_SHIPPING_ACTION}
                  placeholder={UPDATE_PRODUCT_STRINGS.SELECT_SHIPPING_ACTION}
                  size="large"
                  showSearch
                  className="form-select mb-3"
                  onChange={(value) => {
                    setShipping(value === "true");
                  }}
                  value={shipping ? "true" : "false"}
                >
                  <Option value="false">
                    {UPDATE_PRODUCT_STRINGS.SELECT_SHIPPING_NO_ACTION}
                  </Option>
                  <Option value="true">
                    {UPDATE_PRODUCT_STRINGS.SELECT_SHIPPING_YES_ACTION}
                  </Option>
                </Select>
              </div>
              <div className="mb-3">
                <button
                  className="btn btn-primary"
                  onClick={handleUpdate}
                  aria-label={UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ACTION}
                >
                  {UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ACTION}
                </button>
              </div>
              <div className="mb-3">
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  aria-label={UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION}
                >
                  {UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UpdateProduct;
