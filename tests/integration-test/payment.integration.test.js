import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app.js";
import orderModel from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import productModel from "../../models/productModel.js";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import braintree from "braintree";

dotenv.config();
jest.mock("../../config/db.js", () => jest.fn());

const gateway = new braintree.BraintreeGateway({
	environment: braintree.Environment.Sandbox, // Use Sandbox to avoid real charges
	merchantId: process.env.BRAINTREE_MERCHANT_ID,
	publicKey: process.env.BRAINTREE_PUBLIC_KEY,
	privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

describe("Braintree Payment Controllers Integration Tests", () => {
	let mongod;
	let testUser;
	let testProducts = [];
	let authToken;
	let braintreeInstance;

	// Set up the in-memory database before all tests
	beforeAll(async () => {
		// Create an instance of MongoMemoryServer
		mongod = await MongoMemoryServer.create();
		const mongoUri = mongod.getUri();

		// Connect to the in-memory database
		await mongoose.connect(mongoUri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		// Create a test user
		testUser = await User.create({
			name: "Test User",
			email: "test@example.com",
			password: "password123",
			phone: "1234567890",
			address: "Test Address",
			answer: "Test Answer",
		});

		// Ensure use the correct JWT_SECRET 
		const JWT_SECRET = process.env.JWT_SECRET;
		// Create an auth token for the test user with complete payload 
		authToken = JWT.sign({ _id: testUser._id }, JWT_SECRET, {
			expiresIn: "7d",
		});

		const testCategory = await mongoose
			.model("Category")
			.create({ name: "Test Category" });

		// Create test products
		const productData = [
			{
				name: "Product 1",
				description: "Test product 1",
				price: 100,
				quantity: 10,
				category: testCategory._id,
				slug: "product-1",
			},
			{
				name: "Product 2",
				description: "Test product 2",
				price: 200,
				quantity: 5,
				category: testCategory._id,
				slug: "product-2",
			},
		];
		for (const product of productData) {
			const newProduct = await productModel.create(product);
			testProducts.push(newProduct);
		}

		// Get the braintree gateway instance from the constructor mock
		braintreeInstance = gateway;
	});

	// Clean up after all tests
	afterAll(async () => {
		// Clean up test data
		await User.deleteMany({});
		await productModel.deleteMany({});
		await orderModel.deleteMany({});

		// Close the database connection
		await mongoose.connection.close();

		// Stop the MongoDB Memory Server
		if (mongod) {
			await mongod.stop();
		}
	});

	// Clear mock data before each test
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("braintreeTokenController", () => {
		it("should return a client token successfully", async () => {
			const response = await request(app)
				.get("/api/v1/product/braintree/token")
				.set("Authorization", authToken)
				.expect(200);

			expect(response.body).toHaveProperty("clientToken");
		});

		it("should return 401 when no auth token is provided", async () => {
			const response = await request(app)
				.get("/api/v1/product/braintree/token")
				.expect(401);

			expect(response.body).toHaveProperty("success", false);
			expect(response.body).toHaveProperty("message");
		});
	});

	describe("brainTreePaymentController", () => {
		let orderCountBefore;

		beforeEach(async () => {
			// Get the current order count before each test
			orderCountBefore = await orderModel.countDocuments();
		});

		it("should process payment successfully and create a real order", async () => {
			// Create a cart with the test products
			const cart = testProducts.map((product) => ({
				_id: product._id,
				name: product.name,
				price: product.price,
			}));

			// Total price should be 300 (100 + 200)
			const expectedAmount = "300.00";

			const response = await request(app)
				.post("/api/v1/product/braintree/payment")
				.set("Authorization", authToken)
				.send({
					nonce: "fake-valid-nonce",
					cart: cart,
				})
				.expect(200);

			expect(response.body).toHaveProperty("ok", true);

			// Verify a new order was created in the database
			const orderCountAfter = await orderModel.countDocuments();
			expect(orderCountAfter).toBe(orderCountBefore + 1);

			// Find the newly created order and verify it
			const newOrder = await orderModel.findOne().sort({ createdAt: -1 });
			expect(newOrder).not.toBeNull();
			expect(newOrder.products.length).toBe(cart.length);
			expect(newOrder.buyer.toString()).toBe(testUser._id.toString());
			expect(newOrder.status).toBe("Not Processed");
			expect(newOrder.payment).toHaveProperty("success", true);
      expect(newOrder.payment.transaction).toHaveProperty('amount', expectedAmount);
		});

		it("should reject payment with empty cart", async () => {
			const response = await request(app)
				.post("/api/v1/product/braintree/payment")
				.set("Authorization", authToken)
				.send({
					nonce: "fake-valid-nonce",
					cart: [],
				})
				.expect(500);

			expect(response.body).toHaveProperty("error", "Cart is empty");

			// Verify no new order was created
			const orderCountAfter = await orderModel.countDocuments();
			expect(orderCountAfter).toBe(orderCountBefore);
		});

    it("should reject payment with invalid nonce", async () => {
			const cart = testProducts.map((product) => ({
				_id: product._id,
				name: product.name,
				price: product.price,
			}));

			const response = await request(app)
				.post("/api/v1/product/braintree/payment")
				.set("Authorization", authToken)
				.send({
					nonce: "fake-invalid-nonce",
					cart: cart,
				})
				.expect(200);

        expect(response.body).toHaveProperty("ok", true);

        // Verify a new order was created in the database
        const orderCountAfter = await orderModel.countDocuments();
        expect(orderCountAfter).toBe(orderCountBefore + 1);
  
        // Find the newly created order and verify it
        const newOrder = await orderModel.findOne().sort({ createdAt: -1 });
        expect(newOrder).not.toBeNull();
        expect(newOrder.products.length).toBe(cart.length);
        expect(newOrder.buyer.toString()).toBe(testUser._id.toString());
        expect(newOrder.status).toBe("Not Processed");
        expect(newOrder.payment).toHaveProperty("success", false);
		});


		it("should calculate total amount correctly with multiple items", async () => {
			// Create a cart with all products
			const cart = testProducts.map((product) => ({
				_id: product._id,
				name: product.name,
				price: product.price,
			}));

			// Add another product with a decimal price
			cart.push({
				_id: new mongoose.Types.ObjectId(),
				name: "Product 3",
				price: 24.99,
			});

			// Expected total: 100 + 200 + 24.99 = 324.99
			const expectedTotal = "324.99";

			const response = await request(app)
				.post("/api/v1/product/braintree/payment")
				.set("Authorization", authToken)
				.send({
					nonce: "fake-valid-nonce",
					cart: cart,
				})
				.expect(200);

			// Verify the amount passed to the transaction is correct
			expect(response.body).toHaveProperty("ok", true);

			// Verify a new order was created in the database
			const orderCountAfter = await orderModel.countDocuments();
			expect(orderCountAfter).toBe(orderCountBefore + 1);

			// Find the newly created order and verify it
			const newOrder = await orderModel.findOne().sort({ createdAt: -1 });
			expect(newOrder).not.toBeNull();
			expect(newOrder.products.length).toBe(cart.length);
			expect(newOrder.buyer.toString()).toBe(testUser._id.toString());
			expect(newOrder.status).toBe("Not Processed");
			expect(newOrder.payment).toHaveProperty("success", true);
      expect(newOrder.payment.transaction).toHaveProperty('amount', expectedTotal);
		});


		it("should return 401 when no auth token is provided", async () => {
			const cart = testProducts.map((product) => ({
				_id: product._id,
				name: product.name,
				price: product.price,
			}));

			const response = await request(app)
				.post("/api/v1/product/braintree/payment")
				.send({
					nonce: "mock-payment-nonce",
					cart: cart,
				})
				.expect(401);

			expect(response.body).toHaveProperty("success", false);
			// Using a more generic check since the exact message may vary
			expect(response.body).toHaveProperty("message");
		});
	});
});
