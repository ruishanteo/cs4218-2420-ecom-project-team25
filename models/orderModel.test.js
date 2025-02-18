import mongoose from "mongoose";
import orderModel from "./orderModel";

const mockingoose = require('mockingoose');

beforeEach(() => {
  mockingoose.resetAll(); // Reset mocks before each test
});

describe("Order Model", () => {
  it('should create a new order with default status "Not Processed"', async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: "Not Processed",
    };

    mockingoose(orderModel).toReturn(mockOrder, "save");

    const order = new orderModel(mockOrder);
    const savedOrder = await order.save();

    expect(savedOrder.status).toBe("Not Processed");
    expect(savedOrder.products).toHaveLength(1);
    expect(savedOrder.payment).toEqual({});
  });

  it("should throw an error if invalid status is provided", async () => {
    const invalidOrder = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: "Invalid Status",
    });

    let error;
    try {
      await invalidOrder.validate();
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(error.message).toContain("`Invalid Status` is not a valid enum value");
  });

  it("should not create an order without a buyer", async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
    });
  
    let error;
    try {
      await order.validate(); // Validate without saving to the database
    } catch (err) {
      error = err;
    }
  
    // Expect an error because 'buyer' is required
    expect(error).toBeTruthy();
    expect(error.message).toContain("Path `buyer` is required.");
  });
  
  it("should not create an order without a product", async () => {
    const order = new orderModel({
      products: [], // Empty array (invalid)
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });
  
    let error;
    try {
      await order.validate(); // Validate without saving
    } catch (err) {
      error = err;
    }
  
    // Expect an error because 'products' is required and must contain at least one item
    expect(error).toBeTruthy();
    expect(error.message).toContain("Order must contain at least one product.");
  });
  

  it("should retrieve an order from the database", async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: "Not Processed",
    };

    mockingoose(orderModel).toReturn(mockOrder, "findOne");

    const foundOrder = await orderModel.findById(mockOrder._id);

    expect(foundOrder).not.toBeNull();
    expect(foundOrder.buyer.toString()).toBe(mockOrder.buyer.toString());
    expect(foundOrder.products).toHaveLength(1);
    expect(foundOrder.products[0].toString()).toBe(mockOrder.products[0].toString());
  });

  it("should update an order's status", async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: "Shipped",
    };

    mockingoose(orderModel).toReturn(mockOrder, "findOneAndUpdate");

    const updatedOrder = await orderModel.findByIdAndUpdate(
      mockOrder._id,
      { status: "Shipped" },
      { new: true }
    );

    expect(updatedOrder.status).toBe("Shipped");
  });

  it("should delete an order", async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    };

    mockingoose(orderModel).toReturn(mockOrder, "findOneAndDelete");

    const deletedOrder = await orderModel.findByIdAndDelete(mockOrder._id);
    
    expect(deletedOrder).not.toBeNull();
    expect(deletedOrder._id.toString()).toBe(mockOrder._id.toString());
  });
});
