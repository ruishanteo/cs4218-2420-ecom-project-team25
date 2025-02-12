import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import orderModel from './orderModel';

let mongoServer;

beforeAll(async () => {
jest.setTimeout(10000);
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
    await orderModel.deleteMany(); // Clean database before each test
});

describe('Order Model', () => {
  it('should create a new order with default status "Not Processed"', async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    await order.save();

    // Check that the default status is 'Not Process'
    expect(order.status).toBe('Not Processed');
    expect(order.products).toHaveLength(1); // Ensure there is one product
    expect(order.payment).toEqual({}); // Ensure payment is an empty object
  });

  it('should throw an error if invalid status is provided', async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: 'Invalid Status',
    });

    let error;
    try {
      await order.save();
    } catch (err) {
      error = err;
    }

    // Expect an error because 'Invalid Status' is not a valid enum value
    expect(error).toBeTruthy();
    expect(error.message).toContain('validation failed');
  });

  it('should create an order with a valid status', async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: 'Shipped',
    });

    const savedOrder = await order.save();

    // Check that the status is correctly set
    expect(savedOrder.status).toBe('Shipped');
  });

  it('should not create an order without payment details', async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
    });

    let error;
    try {
      await order.save();
    } catch (err) {
      error = err;
    }

    // Expect an error because 'payment' is required
    expect(error).toBeTruthy();
    expect(error.message).toContain('Path `payment` is required.');
  });


  it('should not create an order without a product', async () => {
    const order = new orderModel({
      products: [],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    let error;
    try {
      await order.save();
    } catch (err) {
      error = err;
    }

    // Expect an error because 'products' is required
    expect(error).toBeTruthy();
    expect(error.message).toContain('Order must contain at least one product.');
  });

  it('should not create an order without a buyer', async () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
    });

    let error;
    try {
      await order.save();
    } catch (err) {
      error = err;
    }

    // Expect an error because 'buyer' is required
    expect(error).toBeTruthy();
    expect(error.message).toContain('Path `buyer` is required.');
  });

  it("should retrieve an order from the database", async () => {
    const order = await orderModel.create({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });
  
    const foundOrder = await orderModel.findById(order._id);
  
    expect(foundOrder).not.toBeNull();
    expect(foundOrder.buyer.toString()).toBe(order.buyer.toString());
    expect(foundOrder.products).toHaveLength(1);
    expect(foundOrder.products[0].toString()).toBe(order.products[0].toString());
  });
  

  it("should update an order's status", async () => {
    const order = await orderModel.create({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });
    expect(order.status).toBe("Not Processed");


    order.status = "Shipped";
    const updatedOrder = await order.save();
  
    expect(updatedOrder.status).toBe("Shipped");
  });

  it("should delete an order", async () => {
    const order = await orderModel.create({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });
  
    await orderModel.findByIdAndDelete(order._id);
    const deletedOrder = await orderModel.findById(order._id);
  
    expect(deletedOrder).toBeNull();
  });
});
