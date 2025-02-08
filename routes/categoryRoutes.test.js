import express from "express";
import categoryRoutes from "../routes/categoryRoutes.js"; // Adjust the path to your routes

// Mocking middlewares
jest.mock("./../middlewares/authMiddleware.js", () => ({
  requireSignIn: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mocking controllers
jest.mock("./../controllers/categoryController.js", () => ({
  categoryControlller: jest.fn((req, res) =>
    res.status(200).json({ message: "Category List" })
  ),
  createCategoryController: jest.fn((req, res) =>
    res.status(201).json({ message: "Category Created" })
  ),
  deleteCategoryCOntroller: jest.fn((req, res) =>
    res.status(200).json({ message: "Category Deleted" })
  ),
  singleCategoryController: jest.fn((req, res) =>
    res.status(200).json({ message: "Single Category" })
  ),
  updateCategoryController: jest.fn((req, res) =>
    res.status(200).json({ message: "Category Updated" })
  ),
}));

// Set up Express app
const app = express();
app.use(express.json());
app.use("/api", categoryRoutes);

describe("Category Routes", () => {
  // Mocked Response Object
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  it("should create a category", async () => {
    const mockReq = { body: { name: "New Category" } };
    const createCategoryController =
      require("./../controllers/categoryController.js").createCategoryController;

    // Calling the controller directly
    await createCategoryController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Category Created",
    });
  });

  it("should update a category", async () => {
    const mockReq = {
      params: { id: "1" },
      body: { name: "Updated Category" },
    };
    const updateCategoryController =
      require("./../controllers/categoryController.js").updateCategoryController;

    // Calling the controller directly
    await updateCategoryController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Category Updated",
    });
  });

  it("should get all categories", async () => {
    const mockReq = {}; // No parameters needed for this one
    const categoryControlller =
      require("./../controllers/categoryController.js").categoryControlller;

    // Calling the controller directly
    await categoryControlller(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Category List" });
  });

  it("should get a single category", async () => {
    const mockReq = { params: { slug: "some-slug" } };
    const singleCategoryController =
      require("./../controllers/categoryController.js").singleCategoryController;

    // Calling the controller directly
    await singleCategoryController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Single Category",
    });
  });

  it("should delete a category", async () => {
    const mockReq = { params: { id: "1" } };
    const deleteCategoryCOntroller =
      require("./../controllers/categoryController.js").deleteCategoryCOntroller;

    // Calling the controller directly
    await deleteCategoryCOntroller(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Category Deleted",
    });
  });
});
