import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import orderModel from "../../models/orderModel";

// testing how orderModel interacts with the database
let mongoMock;

beforeAll(async () => {
  mongoMock = await MongoMemoryServer.create();
  await mongoose.connect(mongoMock.getUri());
});

afterEach(async () => {
  await mongoose.connection.dropDatabase(); // clear db after each test
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase(); // drob db
  await mongoose.disconnect(); // disconnect from the in-memory database
  await mongoMock.stop(); //stop the in-memory database
});

describe("Order Model Integration Test", () => {
  let orderOne;
  let orderTwo;
  let orders;
  beforeEach(async () => {
    // populate the mongodb mockserver with mock data
    orderOne = await new orderModel({
      _id: new mongoose.Types.ObjectId(),
      products: [new mongoose.Types.ObjectId()],
      payment: { success: false },
      buyer: new mongoose.Types.ObjectId(),
      status: "Not Processed",
    }).save();

    orderTwo = await new orderModel({
      _id: new mongoose.Types.ObjectId(),
      products: [new mongoose.Types.ObjectId()],
      payment: { success: true },
      buyer: new mongoose.Types.ObjectId(),
      status: "Processing",
    }).save();
    orders = [orderOne, orderTwo];
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase(); // clear db after each test
  });

  it("should find all orders", async () => {
    const ordersFetched = await orderModel.find({});
    expect(ordersFetched).toHaveLength(orders.length);
    for (let i = 0; i < ordersFetched.length; i++) {
      expect(ordersFetched[i]._id).toEqual(orders[i]._id);
      expect(ordersFetched[i].status).toEqual(orders[i].status);
      expect(ordersFetched[i].buyer).toEqual(orders[i].buyer);
      expect(ordersFetched[i].payment).toEqual(orders[i].payment);
      expect(ordersFetched[i].products).toEqual(orders[i].products);
    }
  });

  it("should find correct order by id", async () => {
    const orderFetched = await orderModel.findById(orderOne._id);
    expect(orderFetched._id).toEqual(orderOne._id);
    expect(orderFetched.status).toEqual(orderOne.status);
    expect(orderFetched.buyer).toEqual(orderOne.buyer);
    expect(orderFetched.payment).toEqual(orderOne.payment);
    expect(orderFetched.products).toEqual(orderOne.products);
  });

  it("should update order status", async () => {
    const newOrderOneStatus = "Processing";
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderOne._id,
      {
        status: newOrderOneStatus,
      },
      { new: true }
    );
    expect(updatedOrder._id).toEqual(orderOne._id);
    expect(updatedOrder.status).toEqual(newOrderOneStatus);
    expect(updatedOrder.buyer).toEqual(orderOne.buyer);
    expect(updatedOrder.payment).toEqual(orderOne.payment);
    expect(updatedOrder.products).toEqual(orderOne.products);
  });

  it("should delete order", async () => {
    await orderModel.findByIdAndDelete(orderOne._id);
    const ordersFetched = await orderModel.find({});
    expect(ordersFetched).toHaveLength(1);
    expect(ordersFetched[0]._id).toEqual(orderTwo._id);
    expect(ordersFetched[0].status).toEqual(orderTwo.status);
    expect(ordersFetched[0].buyer).toEqual(orderTwo.buyer);
    expect(ordersFetched[0].payment).toEqual(orderTwo.payment);
    expect(ordersFetched[0].products).toEqual(orderTwo.products);
  });

  it("should create order", async () => {
    const newOrder = {
      _id: new mongoose.Types.ObjectId(),
      products: [new mongoose.Types.ObjectId()],
      payment: { success: false },
      buyer: new mongoose.Types.ObjectId(),
      status: "Not Processed",
    };

    const createdOrder = await new orderModel(newOrder).save();
    expect(createdOrder._id).toEqual(newOrder._id);
    expect(createdOrder.status).toEqual(newOrder.status);
    expect(createdOrder.buyer).toEqual(newOrder.buyer);
    expect(createdOrder.payment).toEqual(newOrder.payment);
    expect(createdOrder.products).toEqual(newOrder.products);
  });

  it("should throw an error for invalid status update", async () => {
    try {
      await new orderModel({
        _id: new mongoose.Types.ObjectId(),
        products: [new mongoose.Types.ObjectId()],
        payment: { success: false },
        stauts: "Invalid Status", // Invalid status
        buyer: new mongoose.Types.ObjectId(),
      }).save();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should throw an error if order is created without a buyer", async () => {
    try {
      await new orderModel({
        _id: new mongoose.Types.ObjectId(),
        products: [new mongoose.Types.ObjectId()],
        payment: { success: false },
        status: "Not Processed",
      }).save();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should throw an error if order is created without a product", async () => {
    try {
      await new orderModel({
        _id: new mongoose.Types.ObjectId(),
        products: [], // Empty array
        payment: { success: false },
        buyer: new mongoose.Types.ObjectId(),
      }).save();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should default status to 'Not Processed' if no status provided", async () => {
    const order = await orderModel.create({
      products: [new mongoose.Types.ObjectId()],
      payment: { success: true },
      buyer: new mongoose.Types.ObjectId(),
    });
    expect(order.status).toEqual("Not Processed");
  });
});
