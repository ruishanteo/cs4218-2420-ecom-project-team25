import { useState, useEffect } from "react";
import axios from "axios";

export const API_URLS = {
  GET_CATEGORIES: "/api/v1/category/get-category",
};

export const USE_CATEGORY_STRINGS = {
  ERROR: "Error in getting categories",
};

export default function useCategory() {
  const [categories, setCategories] = useState([]);

  const getCategories = async () => {
    try {
      const { data } = await axios.get(API_URLS.GET_CATEGORIES);
      if (!data?.success) {
        throw new Error(USE_CATEGORY_STRINGS.ERROR);
      }
      setCategories(data?.category);
    } catch (error) {
      console.log(error);
    }
  };

  const refreshCategories = () => {
    getCategories();
  };

  useEffect(() => {
    getCategories();
  }, []);

  return [categories, refreshCategories];
}
