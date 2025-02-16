import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import CategoryForm from "../../components/Form/CategoryForm";
import { Modal } from "antd";

export const CREATE_CATEGORY_STRINGS = {
  CREATE_CATEGORY_ACTION: "Create Category",
  UPDATE_CATEGORY_ACTION: "Edit",
  DELETE_CATEGORY_ACTION: "Delete",

  CREATE_CATEGORY_ERROR: "Something went wrong in creating category",
  FETCH_CATEGORY_ERROR: "Something went wrong in getting category",
  UPDATE_CATEGORY_ERROR: "Something went wrong in updating category",
  DELETE_CATEGORY_ERROR: "Something went wrong in deleting category",

  CATEGORY_CREATED: "Category created successfully",
  CATEGORY_UPDATED: "Category updated successfully",
  CATEGORY_DELETED: "Category deleted successfully",
};

export const API_URLS = {
  CREATE_CATEGORY: "/api/v1/category/create-category",
  GET_CATEGORIES: "/api/v1/category/get-category",
  UPDATE_CATEGORY: "/api/v1/category/update-category",
  DELETE_CATEGORY: "/api/v1/category/delete-category",
};

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(API_URLS.CREATE_CATEGORY, {
        name,
      });
      if (data?.success) {
        toast.success(CREATE_CATEGORY_STRINGS.CATEGORY_CREATED);
      } else {
        throw new Error("Error in creating category");
      }
    } catch (error) {
      toast.error(CREATE_CATEGORY_STRINGS.CREATE_CATEGORY_ERROR);
      console.log(error);
    }
    getAllCategory();
  };

  const getAllCategory = async () => {
    try {
      const { data } = await axios.get(API_URLS.GET_CATEGORIES);
      if (data.success) {
        setCategories(data.category);
      } else {
        throw new Error("Error in getting category");
      }
    } catch (error) {
      toast.error(CREATE_CATEGORY_STRINGS.FETCH_CATEGORY_ERROR);
      console.log(error);
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(
        `${API_URLS.UPDATE_CATEGORY}/${selected._id}`,
        { name: updatedName }
      );
      if (data.success) {
        toast.success(CREATE_CATEGORY_STRINGS.CATEGORY_UPDATED);
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
      } else {
        throw new Error("Error in updating category");
      }
    } catch (error) {
      toast.error(CREATE_CATEGORY_STRINGS.UPDATE_CATEGORY_ERROR);
    }
    getAllCategory();
  };

  const handleDelete = async (pId) => {
    try {
      const { data } = await axios.delete(`${API_URLS.DELETE_CATEGORY}/${pId}`);
      if (data.success) {
        toast.success(CREATE_CATEGORY_STRINGS.CATEGORY_DELETED);
      } else {
        throw new Error("Error in deleting category");
      }
    } catch (error) {
      toast.error(CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ERROR);
    }
    getAllCategory();
  };

  return (
    <Layout title={"Dashboard - Create Category"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Manage Category</h1>
            <div className="p-3 w-50">
              <CategoryForm
                handleSubmit={handleSubmit}
                value={name}
                setValue={setName}
              />
            </div>
            <div className="w-75">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody data-testid="create-category-list">
                  {categories?.map((c) => (
                    <tr key={c._id} data-testid={`create-category-${c._id}`}>
                      <td>{c.name}</td>
                      <td>
                        <button
                          className="btn btn-primary ms-2"
                          data-testid={`update-category-${c._id}`}
                          onClick={() => {
                            setVisible(true);
                            setUpdatedName(c.name);
                            setSelected(c);
                          }}
                        >
                          {CREATE_CATEGORY_STRINGS.UPDATE_CATEGORY_ACTION}
                        </button>
                        <button
                          className="btn btn-danger ms-2"
                          data-testid={`delete-category-${c._id}`}
                          onClick={() => {
                            handleDelete(c._id);
                          }}
                        >
                          {CREATE_CATEGORY_STRINGS.DELETE_CATEGORY_ACTION}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Modal
              onCancel={() => setVisible(false)}
              footer={null}
              open={visible}
            >
              <div data-testid="update-category-modal">
                <CategoryForm
                  value={updatedName}
                  setValue={setUpdatedName}
                  handleSubmit={handleUpdate}
                />
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateCategory;
