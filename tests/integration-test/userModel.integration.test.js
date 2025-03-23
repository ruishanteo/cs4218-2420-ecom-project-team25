import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import userModel from '../../models/userModel';

let mongoMock;

beforeAll(async () => {
  mongoMock = await MongoMemoryServer.create();
  process.env = { MONGO_URL: mongoMock.getUri() };
  await mongoose.connect(process.env.MONGO_URL);
  await mongoose.connection.db.dropDatabase();
}, 20000);

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  await mongoMock.stop();
}, 20000);

describe('User Model CRUD Operations', () => {
  let userOne;
  let userTwo;

  beforeEach(async () => {
    jest.clearAllMocks();
    await userModel.deleteMany({});

    userOne = await new userModel({
      name: 'mockuser',
      email: 'email@123.com',
      password: 'password123',
      phone: '91234567',
      address: { street: '123 Main St', city: 'Testville' },
      answer: 'answer1'
    }).save();

    userTwo = await new userModel({
      name: 'adminuser',
      email: 'admin@123.com',
      password: 'admin123',
      phone: '91234568',
      address: { street: '456 Admin Ave', city: 'Adminville' },
      answer: 'answer2',
      role: 1
    }).save();
  });

  afterEach(async () => {
    await userModel.deleteMany({});
  });

  // CREATE operations
  describe('Create Operations', () => {
    it('should create a user with default role', async () => {
      const newUser = {
        name: 'newuser',
        email: 'new@123.com',
        password: 'new123',
        phone: '91234569',
        address: { street: '789 New St', city: 'Newville' },
        answer: 'answer3'
      };

      const createdUser = await new userModel(newUser).save();
      
      expect(createdUser._id).toBeDefined();
      expect(createdUser.name).toBe(newUser.name);
      expect(createdUser.email).toBe(newUser.email);
      expect(createdUser.password).toBe(newUser.password);
      expect(createdUser.phone).toBe(newUser.phone);
      expect(createdUser.address).toEqual(newUser.address);
      expect(createdUser.answer).toBe(newUser.answer);
      expect(createdUser.role).toBe(0); // Default role
      expect(createdUser.createdAt).toBeDefined();
      expect(createdUser.updatedAt).toBeDefined();
    });

    it('should create a user with specified role', async () => {
      const newAdminUser = {
        name: 'newadmin',
        email: 'newadmin@123.com',
        password: 'admin123',
        phone: '91234570',
        address: { street: '321 Admin Blvd', city: 'Adminville' },
        answer: 'answer4',
        role: 1
      };

      const createdUser = await new userModel(newAdminUser).save();
      
      expect(createdUser.role).toBe(1);
    });

    it('should trim whitespace from name when creating user', async () => {
      const userWithWhitespaceName = {
        name: '  trimmeduser  ',
        email: 'trimmed@123.com',
        password: 'trimmed123',
        phone: '91234571',
        address: { street: '123 Trim St', city: 'Trimville' },
        answer: 'answer5'
      };

      const createdUser = await new userModel(userWithWhitespaceName).save();
      
      expect(createdUser.name).toBe('trimmeduser');
    });

    it('should reject creating a user with duplicate email', async () => {
      const duplicateEmailUser = {
        name: 'duplicate',
        email: 'email@123.com', // Same as userOne
        password: 'duplicate123',
        phone: '91234572',
        address: { street: '123 Dup St', city: 'Dupville' },
        answer: 'answer6'
      };

      await expect(new userModel(duplicateEmailUser).save()).rejects.toThrow();
    });
  });

  // READ operations
  describe('Read Operations', () => {
    it('should find a user by id', async () => {
      const foundUser = await userModel.findById(userOne._id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.name).toBe(userOne.name);
      expect(foundUser.email).toBe(userOne.email);
    });

    it('should find all users', async () => {
      const users = await userModel.find({});
      
      expect(users).toHaveLength(2);
      expect(users.map(u => u.email)).toContain(userOne.email);
      expect(users.map(u => u.email)).toContain(userTwo.email);
    });

    it('should find users with specific criteria', async () => {
      const adminUsers = await userModel.find({ role: 1 });
      
      expect(adminUsers).toHaveLength(1);
      expect(adminUsers[0].email).toBe(userTwo.email);
      
      const regularUsers = await userModel.find({ role: 0 });
      
      expect(regularUsers).toHaveLength(1);
      expect(regularUsers[0].email).toBe(userOne.email);
    });

    it('should find a user by email', async () => {
      const foundUser = await userModel.findOne({ email: userOne.email });
      
      expect(foundUser).toBeDefined();
      expect(foundUser.name).toBe(userOne.name);
    });

    it('should support projection to exclude sensitive fields', async () => {
      const foundUser = await userModel.findById(userOne._id).select('-password');
      
      expect(foundUser).toBeDefined();
      expect(foundUser.password).toBeUndefined();
      expect(foundUser.name).toBe(userOne.name);
    });
  });

  // UPDATE operations
  describe('Update Operations', () => {
    it('should update a user using findByIdAndUpdate', async () => {
      const updates = {
        name: 'updateduser',
        phone: '91234573'
      };
      
      const updatedUser = await userModel.findByIdAndUpdate(
        userOne._id,
        updates,
        { new: true }
      );
      
      expect(updatedUser.name).toBe(updates.name);
      expect(updatedUser.phone).toBe(updates.phone);
      expect(updatedUser.email).toBe(userOne.email); // Other fields unchanged
      
      // Verify with a fresh fetch from DB
      const freshUser = await userModel.findById(userOne._id);
      expect(freshUser.name).toBe(updates.name);
      expect(freshUser.phone).toBe(updates.phone);
    });

    it('should update a user using updateOne', async () => {
      const result = await userModel.updateOne(
        { _id: userOne._id },
        { $set: { address: { street: 'New Street', city: 'New City' } } }
      );
      
      expect(result.acknowledged).toBe(true);
      expect(result.modifiedCount).toBe(1);
      
      const updatedUser = await userModel.findById(userOne._id);
      expect(updatedUser.address).toEqual({ street: 'New Street', city: 'New City' });
    });

    it('should update multiple users using updateMany', async () => {
      // First create another regular user
      await new userModel({
        name: 'anotheruser',
        email: 'another@123.com',
        password: 'another123',
        phone: '91234574',
        address: { street: '999 Another St', city: 'Anotherville' },
        answer: 'answer7'
      }).save();
      
      const result = await userModel.updateMany(
        { role: 0 }, // Update all regular users
        { $set: { answer: 'updatedanswer' } }
      );
      
      expect(result.acknowledged).toBe(true);
      expect(result.modifiedCount).toBe(2); // userOne and the new user
      
      const regularUsers = await userModel.find({ role: 0 });
      expect(regularUsers).toHaveLength(2);
      expect(regularUsers.every(u => u.answer === 'updatedanswer')).toBe(true);
    });

    it('should handle upsert operations', async () => {
      const newUserUpsert = {
        name: 'upsertuser',
        email: 'upsert@123.com',
        password: 'upsert123',
        phone: '91234575',
        address: { street: '777 Upsert St', city: 'Upsertville' },
        answer: 'answer8',
        role: 2
      };
      
      const result = await userModel.updateOne(
        { email: 'upsert@123.com' }, // Doesn't exist yet
        { $set: newUserUpsert },
        { upsert: true }
      );
      
      expect(result.acknowledged).toBe(true);
      expect(result.upsertedCount).toBe(1);
      
      const upsertedUser = await userModel.findOne({ email: 'upsert@123.com' });
      expect(upsertedUser).toBeDefined();
      expect(upsertedUser.name).toBe(newUserUpsert.name);
      expect(upsertedUser.role).toBe(newUserUpsert.role);
    });
  });

  // DELETE operations
  describe('Delete Operations', () => {
    it('should delete a user using findByIdAndDelete', async () => {
      await userModel.findByIdAndDelete(userOne._id);
      
      const deletedUser = await userModel.findById(userOne._id);
      expect(deletedUser).toBeNull();
      
      const remainingUsers = await userModel.find({});
      expect(remainingUsers).toHaveLength(1);
      expect(remainingUsers[0]._id.toString()).toBe(userTwo._id.toString());
    });

    it('should delete a user using deleteOne', async () => {
      const result = await userModel.deleteOne({ email: userOne.email });
      
      expect(result.acknowledged).toBe(true);
      expect(result.deletedCount).toBe(1);
      
      const deletedUser = await userModel.findById(userOne._id);
      expect(deletedUser).toBeNull();
    });

    it('should delete multiple users using deleteMany', async () => {
      // First create additional regular users
      await new userModel({
        name: 'regular1',
        email: 'regular1@123.com',
        password: 'regular123',
        phone: '91234576',
        address: { street: '111 Regular St', city: 'Regularville' },
        answer: 'regular1'
      }).save();
      
      await new userModel({
        name: 'regular2',
        email: 'regular2@123.com',
        password: 'regular123',
        phone: '91234577',
        address: { street: '222 Regular St', city: 'Regularville' },
        answer: 'regular2'
      }).save();
      
      // Verify we have 3 regular users and 1 admin user
      expect(await userModel.countDocuments({ role: 0 })).toBe(3);
      expect(await userModel.countDocuments({ role: 1 })).toBe(1);
      
      // Delete all regular users
      const result = await userModel.deleteMany({ role: 0 });
      
      expect(result.acknowledged).toBe(true);
      expect(result.deletedCount).toBe(3);
      
      // Verify only admin remains
      const remainingUsers = await userModel.find({});
      expect(remainingUsers).toHaveLength(1);
      expect(remainingUsers[0].role).toBe(1);
    });
  });

  // Validation tests
  describe('Model Validation', () => {
    it('should validate a new user with default role 0', async () => {
      const user = new userModel({
        name: 'validuser',
        email: 'valid@123.com',
        password: 'valid123',
        phone: '91234578',
        address: { street: '123 Valid St', city: 'Validville' },
        answer: 'answer9'
      });
      
      await expect(user.validate()).resolves.toBeUndefined();
      expect(user.role).toBe(0);
    });

    it('should validate a user with a specified role', async () => {
      const userWithRole = new userModel({
        name: 'roleuser',
        email: 'role@123.com',
        password: 'role123',
        phone: '91234579',
        address: { street: '123 Role St', city: 'Roleville' },
        answer: 'answer10',
        role: 1
      });
      
      await expect(userWithRole.validate()).resolves.toBeUndefined();
      expect(userWithRole.role).toBe(1);
    });

    it('should require name', async () => {
      const user = new userModel({
        email: 'noname@123.com',
        password: 'noname123',
        phone: '91234580',
        address: { street: '123 NoName St', city: 'NoNameville' },
        answer: 'answer11'
      });
      
      await expect(user.validate()).rejects.toThrow(/Path `name` is required/);
    });

    it('should trim name', async () => {
      const user = new userModel({
        name: ' spacedname ',
        email: 'spaced@123.com',
        password: 'spaced123',
        phone: '91234581',
        address: { street: '123 Spaced St', city: 'Spacedville' },
        answer: 'answer12'
      });
      
      await user.validate();
      expect(user.name).toBe('spacedname');
    });

    it('should require email', async () => {
      const user = new userModel({
        name: 'noemail',
        password: 'noemail123',
        phone: '91234582',
        address: { street: '123 NoEmail St', city: 'NoEmailville' },
        answer: 'answer13'
      });
      
      await expect(user.validate()).rejects.toThrow(/Path `email` is required/);
    });

    it('should validate email format', async () => {
      const user = new userModel({
        name: 'bademail',
        email: 'invalidemail',
        password: 'bademail123',
        phone: '91234583',
        address: { street: '123 BadEmail St', city: 'BadEmailville' },
        answer: 'answer14'
      });
      
      await expect(user.validate()).rejects.toThrow(/Please enter a valid email address/);
    });

    it('should require password', async () => {
      const user = new userModel({
        name: 'nopassword',
        email: 'nopassword@123.com',
        phone: '91234584',
        address: { street: '123 NoPassword St', city: 'NoPasswordville' },
        answer: 'answer15'
      });
      
      await expect(user.validate()).rejects.toThrow(/Path `password` is required/);
    });

    it('should require phone number', async () => {
      const user = new userModel({
        name: 'nophone',
        email: 'nophone@123.com',
        password: 'nophone123',
        address: { street: '123 NoPhone St', city: 'NoPhoneville' },
        answer: 'answer16'
      });
      
      await expect(user.validate()).rejects.toThrow(/Path `phone` is required/);
    });

    it('should validate phone number format', async () => {
      const user = new userModel({
        name: 'badphone',
        email: 'badphone@123.com',
        password: 'badphone123',
        phone: 'abc12345',
        address: { street: '123 BadPhone St', city: 'BadPhoneville' },
        answer: 'answer17'
      });
      
      await expect(user.validate()).rejects.toThrow(/Phone number must contain only digits/);
    });

    it('should require address', async () => {
      const user = new userModel({
        name: 'noaddress',
        email: 'noaddress@123.com',
        password: 'noaddress123',
        phone: '91234585',
        answer: 'answer18'
      });
      
      await expect(user.validate()).rejects.toThrow(/Path `address` is required/);
    });

    it('should validate address is non-empty object', async () => {
      const userWithEmptyAddress = new userModel({
        name: 'emptyaddress',
        email: 'emptyaddress@123.com',
        password: 'emptyaddress123',
        phone: '91234586',
        address: {},
        answer: 'answer19'
      });
      
      await expect(userWithEmptyAddress.validate()).rejects.toThrow(/Address must be a non-empty object/);
    });

    it('should require answer', async () => {
      const user = new userModel({
        name: 'noanswer',
        email: 'noanswer@123.com',
        password: 'noanswer123',
        phone: '91234587',
        address: { street: '123 NoAnswer St', city: 'NoAnswerville' }
      });
      
      await expect(user.validate()).rejects.toThrow(/Path `answer` is required/);
    });
  });

  // Edge cases and special behavior
  describe('Edge Cases and Special Behaviors', () => {
    it('should have timestamps', async () => {
      const newUser = await new userModel({
        name: 'timestampuser',
        email: 'timestamp@123.com',
        password: 'timestamp123',
        phone: '91234588',
        address: { street: '123 Timestamp St', city: 'Timestampville' },
        answer: 'answer20'
      }).save();
      
      expect(newUser.createdAt).toBeDefined();
      expect(newUser.createdAt instanceof Date).toBe(true);
      expect(newUser.updatedAt).toBeDefined();
      expect(newUser.updatedAt instanceof Date).toBe(true);
    });
    
    it('should update updatedAt timestamp on changes', async () => {
      const newUser = await new userModel({
        name: 'timeupdate',
        email: 'timeupdate@123.com',
        password: 'timeupdate123',
        phone: '91234589',
        address: { street: '123 TimeUpdate St', city: 'TimeUpdateville' },
        answer: 'answer21'
      }).save();
      
      const originalUpdatedAt = new Date(newUser.updatedAt).getTime();
      
      // Wait a bit to ensure timestamp would be different
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await userModel.findByIdAndUpdate(
        newUser._id,
        { name: 'timeupdate-changed' },
        { new: true }
      );
      
      const updatedUser = await userModel.findById(newUser._id);
      const newUpdatedAt = new Date(updatedUser.updatedAt).getTime();
      
      expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt);
    });
    
    it('should work with mixed address types', async () => {
      // String address
      const userWithStringAddress = await new userModel({
        name: 'stringaddress',
        email: 'stringaddress@123.com',
        password: 'stringaddress123',
        phone: '91234590',
        address: 'String Address, Stringville',
        answer: 'answer22'
      }).save();
      
      expect(userWithStringAddress.address).toBe('String Address, Stringville');
      
      // Complex object address
      const userWithComplexAddress = await new userModel({
        name: 'complexaddress',
        email: 'complexaddress@123.com',
        password: 'complexaddress123',
        phone: '91234591',
        address: {
          street: '123 Complex St',
          city: 'Complexville',
          zipCode: '12345',
          country: 'Complexland',
          coordinates: {
            lat: 12.345,
            long: 67.890
          }
        },
        answer: 'answer23'
      }).save();
      
      expect(userWithComplexAddress.address.street).toBe('123 Complex St');
      expect(userWithComplexAddress.address.coordinates.lat).toBe(12.345);
    });
  });
});