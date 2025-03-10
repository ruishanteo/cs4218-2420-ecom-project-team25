import mongoose from "mongoose";
import orderModel from "./orderModel";


describe("Order Model", () => {
  it('should create a new order with default status "Not Processed"', async () => {
    const order = new orderModel({
      _id: new mongoose.Types.ObjectId(),
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    await expect(order.validate()).resolves.toBeUndefined();
    expect(order.status).toBe("Not Processed"); // Default should be applied
  });

  it("should throw an error if invalid status is provided", async () => {
    const invalidOrder = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: "Invalid Status",
    });

    await expect(invalidOrder.validate()).rejects.toThrow(
      "`Invalid Status` is not a valid enum value"
    );
  });

  it("should not create an order without a buyer", async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
    });

    await expect(order.validate()).rejects.toThrow("Path `buyer` is required.");
  });
  
  it("should not create an order without a product", async () => {
    const order = new orderModel({
      products: [], // Empty array (invalid)
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    await expect(order.validate()).rejects.toThrow(
      "Order must contain at least one product."
    );
  });

  it("should create an order with a product", async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()], // Empty array (invalid)
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    await expect(order.validate()).resolves.toBeUndefined();
  });

  it("should create an order with two product", async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()], // Empty array (invalid)
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    await expect(order.validate()).resolves.toBeUndefined();
  });

});
