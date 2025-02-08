import {
  createCategoryController,
  updateCategoryController,
  categoryControlller,
  singleCategoryController,
  deleteCategoryCOntroller,
} from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";

// Mocking categoryModel and slugify
jest.mock("../models/categoryModel.js");
jest.mock("slugify", () =>
  jest.fn((str) => str.toLowerCase().replace(/\s+/g, "-"))
);

// Mock Response object
const mockRes = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};

// Mock Request objects
const mockReq = {
  body: {},
  params: {},
};

// Sample category data
const categoryData = { name: "Category1", slug: "category1" };

describe("Category Controller", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls after each test
  });

  describe("createCategoryController", () => {
    it("should create a new category", async () => {
      // Mock the request data
      mockReq.body = { name: "New Category" };

      // Mock the database response
      categoryModel.findOne.mockResolvedValue(null); // No existing category found
      categoryModel.prototype.save.mockResolvedValue(categoryData); // Simulate a successful save

      await createCategoryController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.send).toHaveBeenCalledWith({
        category: categoryData,
        success: true,
        message: "new category created",
      });
    });

    it("should return an error if the category already exists", async () => {
      // Mock the request data
      mockReq.body = { name: "Existing Category" };

      // Mock the database response
      categoryModel.findOne.mockResolvedValue({ name: "Existing Category" }); // Simulating existing category

      await createCategoryController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exists",
      });
    });

    it("should return an error if name is not provided", async () => {
      mockReq.body = {}; // No name provided

      await createCategoryController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: "Name is required",
      });
    });
  });

  describe("updateCategoryController", () => {
    it("should update an existing category", async () => {
      mockReq.body = { name: "Updated Category" };
      mockReq.params = { id: "1" };

      // Mock the database update
      categoryModel.findByIdAndUpdate.mockResolvedValue(categoryData); // Mocking successful update

      await updateCategoryController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        messsage: "Category Updated Successfully",
        category: categoryData,
      });
    });

    it("should return an error if category update fails", async () => {
      mockReq.body = { name: "Updated Category" };
      mockReq.params = { id: "1" };

      // Simulate error while updating
      categoryModel.findByIdAndUpdate.mockRejectedValue(
        new Error("Update failed")
      );

      await updateCategoryController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error while updating category",
      });
    });
  });

  describe("categoryControlller", () => {
    it("should return a list of categories", async () => {
      // Mock database response
      categoryModel.find.mockResolvedValue([categoryData]);

      await categoryControlller(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: [categoryData],
      });
    });

    it("should return an error if fetching categories fails", async () => {
      // Simulate error in fetching categories
      categoryModel.find.mockRejectedValue(
        new Error("Failed to fetch categories")
      );

      await categoryControlller(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error while getting all categories",
      });
    });
  });

  describe("singleCategoryController", () => {
    it("should return a single category", async () => {
      mockReq.params = { slug: "category1" };

      // Mock database response
      categoryModel.findOne.mockResolvedValue(categoryData);

      await singleCategoryController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        message: "Get Single Category Successfully",
        category: categoryData,
      });
    });

    it("should return an error if the category is not found", async () => {
      mockReq.params = { slug: "non-existent-category" };

      // Mock no category found
      categoryModel.findOne.mockResolvedValue(null);

      await singleCategoryController(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: "Category not found",
        success: false,
      });
    });
  });

  describe("deleteCategoryCOntroller", () => {
    it("should delete a category successfully", async () => {
      mockReq.params = { id: "1" };

      // Mock successful deletion
      categoryModel.findByIdAndDelete.mockResolvedValue(categoryData);

      await deleteCategoryCOntroller(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        message: "Categry Deleted Successfully",
      });
    });

    it("should return an error if deletion fails", async () => {
      mockReq.params = { id: "1" };

      // Simulate error in deletion
      categoryModel.findByIdAndDelete.mockRejectedValue(
        new Error("Delete failed")
      );

      await deleteCategoryCOntroller(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: false,
        message: "error while deleting category",
        error: expect.any(Error),
      });
    });
  });
});
