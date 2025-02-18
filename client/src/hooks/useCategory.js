import { useState, useEffect } from "react";
import axios from "axios";

export const USE_CATEGORY_STRINGS = {
  ERROR: "Error in getting categories",
};

export default function useCategory() {
  const [categories, setCategories] = useState([]);

  const getCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
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
