import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

export const CREATE_PRODUCT_STRINGS = {
  CREATE_PRODUCT_ACTION: "CREATE PRODUCT",
  DELETE_PRODUCT_ACTION: "DELETE PRODUCT",
  SELECT_CATEGORY_ACTION: "Select a category",
  SELECT_SHIPPING_ACTION: "Select Shipping",
  SELECT_SHIPPING_YES_ACTION: "Yes",
  SELECT_SHIPPING_NO_ACTION: "No",
  UPLOAD_PHOTO_ACTION: "Upload Photo",
  DELETE_PRODUCT_CONFIRM:
    "Delete Product? Enter any key to confirm. This action is irreversible.",

  PRODUCT_NAME_PLACEHOLDER: "Enter name",
  PRODUCT_DESCRIPTION_PLACEHOLDER: "Enter description",
  PRODUCT_PRICE_PLACEHOLDER: "Enter price",
  PRODUCT_QUANTITY_PLACEHOLDER: "Enter quantity",

  FETCH_PRODUCT_ERROR: "Something went wrong in getting product",
  FETCH_CATEGORY_ERROR: "Something went wrong in getting category",
  CREATE_PRODUCT_ERROR: "Something went wrong in creating product",
  PRODUCT_CREATED: "Product created successfully",
};

export const API_URLS = {
  CREATE_PRODUCT: "/api/v1/product/create-product",
  GET_CATEGORIES: "/api/v1/category/get-category",
};

const CreateProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState("");
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    const getAllCategory = async () => {
      try {
        const { data } = await axios.get(API_URLS.GET_CATEGORIES);
        if (data?.success) {
          setCategories(data?.category);
        } else {
          throw new Error("Error in getting category");
        }
      } catch (error) {
        toast.error(CREATE_PRODUCT_STRINGS.FETCH_CATEGORY_ERROR);
        console.log(error);
      }
    };
    getAllCategory();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const productData = new FormData();
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("quantity", quantity);
      productData.append("photo", photo);
      productData.append("category", category);
      productData.append("shipping", shipping);
      const { data } = await axios.post(API_URLS.CREATE_PRODUCT, productData);
      if (data?.success) {
        toast.success(CREATE_PRODUCT_STRINGS.PRODUCT_CREATED);
        navigate("/dashboard/admin/products");
      } else {
        throw new Error("Error in creating product");
      }
    } catch (error) {
      toast.error(CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ERROR);
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
            <h1>Create Product</h1>
            <div className="m-1 w-75">
              <Select
                variant="borderless"
                placeholder="Select a category"
                size="large"
                showSearch
                className="form-select mb-3"
                onChange={(value) => {
                  setCategory(value);
                }}
                data-testid="create-product-category-select"
              >
                {categories?.map((c) => (
                  <Option
                    key={c._id}
                    value={c._id}
                    data-testid={`create-product-option-${c._id}`}
                  >
                    {c.name}
                  </Option>
                ))}
              </Select>
              <div className="mb-3">
                <label className="btn btn-outline-secondary col-md-12">
                  {photo
                    ? photo.name
                    : CREATE_PRODUCT_STRINGS.UPLOAD_PHOTO_ACTION}
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    hidden
                    data-testid="create-product-photo-input"
                  />
                </label>
              </div>
              <div className="mb-3">
                {photo && (
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="product_photo"
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
                  placeholder={CREATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER}
                  className="form-control"
                  onChange={(e) => setName(e.target.value)}
                  data-testid="create-product-name-input"
                />
              </div>
              <div className="mb-3">
                <textarea
                  type="text"
                  value={description}
                  placeholder={
                    CREATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
                  }
                  className="form-control"
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="create-product-description-input"
                />
              </div>

              <div className="mb-3">
                <input
                  type="number"
                  value={price}
                  placeholder={CREATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER}
                  className="form-control"
                  onChange={(e) => setPrice(e.target.value)}
                  data-testid="create-product-price-input"
                />
              </div>
              <div className="mb-3">
                <input
                  type="number"
                  value={quantity}
                  placeholder={
                    CREATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
                  }
                  className="form-control"
                  onChange={(e) => setQuantity(e.target.value)}
                  data-testid="create-product-quantity-input"
                />
              </div>
              <div className="mb-3">
                <Select
                  variant="borderless"
                  placeholder={CREATE_PRODUCT_STRINGS.SELECT_SHIPPING_ACTION}
                  size="large"
                  showSearch
                  className="form-select mb-3"
                  onChange={(value) => {
                    setShipping(value === "true");
                  }}
                  data-testid="create-product-shipping-select"
                >
                  <Option value="false">
                    {CREATE_PRODUCT_STRINGS.SELECT_SHIPPING_NO_ACTION}
                  </Option>
                  <Option value="true">
                    {CREATE_PRODUCT_STRINGS.SELECT_SHIPPING_YES_ACTION}
                  </Option>
                </Select>
              </div>
              <div className="mb-3">
                <button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  data-testid="create-product-button"
                >
                  {CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ACTION}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProduct;
