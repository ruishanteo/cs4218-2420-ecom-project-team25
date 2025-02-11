/**
 * TODO: install supertest and complete tests

import request from "supertest";
import express from "express";
import router from "./categoryRoutes";

// Mock the required middleware and controller methods
jest.mock("../middlewares/authMiddleware", () => ({
  isAdmin: jest.fn((req, res, next) => next()),
  requireSignIn: jest.fn((req, res, next) => next()),
}));

jest.mock("../controllers/categoryController", () => ({
  createCategoryController: jest.fn((req, res) =>
    res.status(201).json({ success: true, message: "Category created" })
  ),
  updateCategoryController: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: "Category updated" })
  ),
  deleteCategoryCOntroller: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: "Category deleted" })
  ),
  categoryControlller: jest.fn((req, res) =>
    res.status(200).json([{ id: 1, name: "Category 1" }])
  ),
  singleCategoryController: jest.fn((req, res) =>
    res.status(200).json({ id: 1, name: "Category 1" })
  ),
}));

// Create express app and use the routes
const app = express();
app.use(express.json());
app.use("/api/v1/category", router); // Use the category routes

// Create the response object for mocking
const response = {
  status: jest.fn(() => response),
  json: jest.fn(),
};

describe("Category Routes", () => {
  describe("/api/v1/category/create-category", () => {
    it("should reach the create category controller", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .send({ name: "New Category" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category created");
      expect(
        require("../controllers/categoryController").createCategoryController
      ).toHaveBeenCalled();
    });
  });

  describe("/api/v1/category/update-category/:id", () => {
    it("should reach the update category controller", async () => {
      const res = await request(app)
        .put("/api/v1/category/update-category/1")
        .send({ name: "Updated Category" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category updated");
      expect(
        require("../controllers/categoryController").updateCategoryController
      ).toHaveBeenCalled();
    });
  });

  describe("/api/v1/category/get-category", () => {
    it("should reach the get all categories controller", async () => {
      const res = await request(app).get("/api/v1/category/get-category");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: "Category 1" }]);
      expect(
        require("../controllers/categoryController").categoryControlller
      ).toHaveBeenCalled();
    });
  });

  describe("/api/v1/category/single-category/:slug", () => {
    it("should reach the get single category controller", async () => {
      const res = await request(app).get(
        "/api/v1/category/single-category/category-1"
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, name: "Category 1" });
      expect(
        require("../controllers/categoryController").singleCategoryController
      ).toHaveBeenCalled();
    });
  });

  describe("/api/v1/category/delete-category/:id", () => {
    it("should reach the delete category controller", async () => {
      const res = await request(app).delete(
        "/api/v1/category/delete-category/1"
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category deleted");
      expect(
        require("../controllers/categoryController").deleteCategoryCOntroller
      ).toHaveBeenCalled();
    });
  });
});

 */
