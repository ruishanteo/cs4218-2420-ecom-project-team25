import {
	registerController,
	loginController,
	forgotPasswordController,
	updateProfileController,
  getUsersController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js"; // Ensure this is imported
import JWT from "jsonwebtoken";

// Mocking the comparePassword function
jest.mock("./../helpers/authHelper.js", () => ({
	comparePassword: jest.fn(),
	hashPassword: jest.fn(),
}));

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("jsonwebtoken");

describe("Auth Controller Tests", () => {
	// Test for registerController
	describe("registerController", () => {
		let req, res;

		beforeEach(() => {
			res = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
			};
			req = {
				body: {},
			};
		});

		it("should register a user successfully", async () => {
			const newUser = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone: "1234567890",
				address: "123 Street",
				answer: "Blue",
			};

			// Mocking findOne to return null (no existing user)
			userModel.findOne = jest.fn().mockResolvedValue(null);

			// Mocking hashPassword function
			hashPassword.mockResolvedValue("hashedpassword");

			// Mocking save to return the new user object
			userModel.prototype.save = jest.fn().mockResolvedValue({
				...newUser,
				_id: "mockedUserId",
				password: "hashedpassword",
			});

			req.body = newUser;

			await registerController(req, res);

			// Ensure that the status is 201 (User registered successfully)
			expect(res.status).toHaveBeenCalledWith(201);

			// Ensure that the response body contains the expected values
			expect(res.send).toHaveBeenCalledWith({
				success: true,
				message: "User Registered Successfully",
				user: expect.objectContaining({
					name: "John Doe",
					email: "john@example.com",
					phone: "1234567890",
					address: "123 Street",
					answer: "Blue",
					_id: "mockedUserId",
				}),
			});
		});

		it("should return an error if name is missing", async () => {
			req.body = {
				email: "john@example.com",
				password: "password123",
				phone: "1234567890",
				address: "123 Street",
				answer: "Blue",
			};

			await registerController(req, res);

			expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
		});

		it("should return an error if email is missing", async () => {
			req.body = {
				name: "John Doe",
				password: "password123",
				phone: "1234567890",
				address: "123 Street",
				answer: "Blue",
			};

			await registerController(req, res);

			expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
		});

		it("should return an error if password is missing", async () => {
			req.body = {
				name: "John Doe",
				email: "john@example.com",
				phone: "1234567890",
				address: "123 Street",
				answer: "Blue",
			};

			await registerController(req, res);

			expect(res.send).toHaveBeenCalledWith({
				message: "Password is Required",
			});
		});

		it("should return an error if phone number is missing", async () => {
			req.body = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				address: "123 Street",
				answer: "Blue",
			};

			await registerController(req, res);

			expect(res.send).toHaveBeenCalledWith({
				message: "Phone Number is Required",
			});
		});

		it("should return an error if address is missing", async () => {
			req.body = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone: "1234567890",
				answer: "Blue",
			};

			await registerController(req, res);

			expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
		});

		it("should return an error if answer is missing", async () => {
			req.body = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone: "1234567890",
				address: "123 Street",
			};

			await registerController(req, res);

			expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
		});

		it("should return an error if the email is already registered", async () => {
			req.body = {
				name: "John Doe",
				email: "john@example.com",
				password: "password123",
				phone: "1234567890",
				address: "123 Street",
				answer: "Blue",
			};

			userModel.findOne = jest
				.fn()
				.mockResolvedValue({ email: "john@example.com" }); // Existing user

			await registerController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				success: false,
				message: "Email is already registered, please log in",
			});
		});
	});

     // Test for loginController
    describe('loginController', () => {
        let req, res;
      
        beforeEach(() => {
          res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
          };
          req = {
            body: {},
          };
        });
      
        it('should return error if email or password is missing', async () => {
          req.body = { email: '', password: '' };
          
          await loginController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Invalid email or password",
          });
        });
      
        it('should return error if email is not registered', async () => {
          req.body = { email: 'john@example.com', password: 'password123' };
      
          // Mocking findOne to return null (no user found)
          userModel.findOne = jest.fn().mockResolvedValue(null);
      
          await loginController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Email is not registered",
          });
        });
      
        it('should return error if password is invalid', async () => {
          req.body = { email: 'john@example.com', password: 'wrongpassword' };
      
          // Mocking findOne to return a valid user
          userModel.findOne = jest.fn().mockResolvedValue({
            email: 'john@example.com',
            password: 'hashedpassword',
          });
      
          // Mocking comparePassword to return false (invalid password)
          comparePassword.mockResolvedValue(false);
      
          await loginController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Invalid Password",
          });
        });
      
        it('should return token and user info on successful login', async () => {
          req.body = { email: 'john@example.com', password: 'password123' };
      
          const user = {
            _id: 'mockedUserId',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            address: '123 Street',
            role: 'user',
            password: 'hashedpassword',
          };
      
          // Mocking findOne to return a valid user
          userModel.findOne = jest.fn().mockResolvedValue(user);
      
          // Mocking comparePassword to return true (valid password)
          comparePassword.mockResolvedValue(true);
      
          // Mocking JWT.sign to return a token
          JWT.sign = jest.fn().mockReturnValue('mockedToken');
      
          await loginController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Logged in successfully",
            user: {
              _id: 'mockedUserId',
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Street',
              role: 'user',
            },
            token: 'mockedToken',
          });
        });
      
        it('should handle errors gracefully', async () => {
          const errorMessage = 'Some unexpected error';
          const error = new Error(errorMessage);
      
          // Mocking findOne to throw an error
          userModel.findOne = jest.fn().mockRejectedValue(error);
      
          req.body = { email: 'john@example.com', password: 'password123' };
      
          await loginController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error when logging in",
            error,
          });
        });
      });
	
    // Test for forgotPasswordController
    describe('forgotPasswordController', () => {
        let req, res;
      
        beforeEach(() => {
          res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
          };
          req = {
            body: {},
          };
        });
      
        it('should return error if email is missing', async () => {
          req.body = { email: '', answer: 'SomeAnswer', newPassword: 'newPassword123' };
      
          await forgotPasswordController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.send).toHaveBeenCalledWith({
            message: "Email is required",
          });
        });
      
        it('should return error if answer is missing', async () => {
          req.body = { email: 'john@example.com', answer: '', newPassword: 'newPassword123' };
      
          await forgotPasswordController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.send).toHaveBeenCalledWith({
            message: "Answer is required",
          });
        });
      
        it('should return error if new password is missing', async () => {
          req.body = { email: 'john@example.com', answer: 'SomeAnswer', newPassword: '' };
      
          await forgotPasswordController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.send).toHaveBeenCalledWith({
            message: "New Password is required",
          });
        });
      
        it('should return error if user does not exist with the given email and answer', async () => {
          req.body = { email: 'john@example.com', answer: 'WrongAnswer', newPassword: 'newPassword123' };
      
          // Mocking findOne to return null (no user found with given email and answer)
          userModel.findOne = jest.fn().mockResolvedValue(null);
      
          await forgotPasswordController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Wrong Email Or Answer",
          });
        });
      
        it('should successfully reset the password if email and answer are correct', async () => {
          req.body = { email: 'john@example.com', answer: 'SomeAnswer', newPassword: 'newPassword123' };
      
          const user = {
            _id: 'mockedUserId',
            email: 'john@example.com',
            answer: 'SomeAnswer',
          };
      
          // Mocking findOne to return a valid user
          userModel.findOne = jest.fn().mockResolvedValue(user);
      
          // Mocking hashPassword to return a hashed password
          hashPassword.mockResolvedValue('hashedPassword123');
      
          // Mocking findByIdAndUpdate to simulate password update
          userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(user);
      
          await forgotPasswordController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Password Reset Successfully",
          });
        });
      
        it('should handle errors gracefully', async () => {
          const errorMessage = 'Some unexpected error';
          const error = new Error(errorMessage);
      
          // Mocking findOne to throw an error
          userModel.findOne = jest.fn().mockRejectedValue(error);
      
          req.body = { email: 'john@example.com', answer: 'SomeAnswer', newPassword: 'newPassword123' };
      
          await forgotPasswordController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Something went wrong",
            error,
          });
        });
      });

      describe('updateProfileController', () => {
        let req, res;
      
        beforeEach(() => {
          res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
          };
          req = {
            body: {},
            user: { _id: 'mockedUserId' },
          };
        });
      
        it('should return error if password is less than 6 characters', async () => {
          req.body = { password: '12345' };
      
          await updateProfileController(req, res);
      
          expect(res.json).toHaveBeenCalledWith({
            error: "Password is required and 6 character long",
          });
        });
      
        it('should successfully update the profile when valid data is provided', async () => {
          const user = {
            _id: 'mockedUserId',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            address: '123 Street Name',
          };
      
          req.body = {
            name: 'John Updated',
            email: 'john@example.com',
            phone: '9876543210',
            address: '456 New Address',
            password: 'newPassword123',
          };
      
          // Mocking findById to return the user
          userModel.findById = jest.fn().mockResolvedValue(user);
          
          // Mocking hashPassword to simulate password hashing
          hashPassword.mockResolvedValue('hashedNewPassword123');
          
          // Mocking findByIdAndUpdate to simulate profile update
          userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
            ...user,
            name: req.body.name,
            phone: req.body.phone,
            address: req.body.address,
            password: 'hashedNewPassword123',
          });
      
          await updateProfileController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: {
              ...user,
              name: req.body.name,
              phone: req.body.phone,
              address: req.body.address,
              password: 'hashedNewPassword123',
            },
          });
        });
      
        it('should return updated profile with unchanged fields if no new data is provided', async () => {
          const user = {
            _id: 'mockedUserId',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            address: '123 Street Name',
          };
      
          req.body = {}; // No data provided to update
      
          // Mocking findById to return the user
          userModel.findById = jest.fn().mockResolvedValue(user);
      
          // Mocking findByIdAndUpdate to simulate no update (data remains the same)
          userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(user);
      
          await updateProfileController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: user,
          });
        });
      
        it('should handle missing user when updating profile', async () => {
          req.body = { name: 'John Updated' };
      
          // Mocking findById to return null (user not found)
          userModel.findById = jest.fn().mockResolvedValue(null);
      
          await updateProfileController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error While Updating Profile",
            error: expect.anything(),
          });
        });
      
        it('should handle errors gracefully', async () => {
          const errorMessage = 'Some unexpected error';
          const error = new Error(errorMessage);
      
          // Mocking findById to throw an error
          userModel.findById = jest.fn().mockRejectedValue(error);
      
          req.body = { name: 'John Updated' };
      
          await updateProfileController(req, res);
      
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error While Updating Profile",
            error,
          });
        });
      });

  describe("getUsersController", () => {
    const mockResponse = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.send = jest.fn().mockReturnValue(res);
      return res;
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return all users with role 0", async () => {
      const mockUsers = [
        { _id: "1", name: "John Doe", email: "john@example.com", role: 0 },
        { _id: "2", name: "Jane Doe", email: "jane@example.com", role: 0 },
        { _id: "3", name: "Admin", email: "admin@example.com", role: 1 },
      ];
      userModel.find.mockImplementation((query) =>
        mockUsers.filter((user) => user.role === query.role)
      );

      const req = {};
      const res = mockResponse();

      await getUsersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Users",
        users: mockUsers.filter((user) => user.role === 0),
      });
    });

    it("should handle errors gracefully", async () => {
      userModel.find.mockRejectedValue(new Error("Database Error"));

      const req = {};
      const res = mockResponse();

      await getUsersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Geting Users",
        error: expect.any(Error),
      });
    });
  });

});
