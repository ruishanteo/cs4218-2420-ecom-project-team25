// repeats the same test as productModel.test.js but with mongo memory server
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import slugify from 'slugify';

import productModel from '../../models/productModel';

const categoryId = '67af4353dd4bf679e3c4d02f';
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

// inspired by https://www.npmjs.com/package/mockingoose with some reference to GitHub Copilot
describe('Product Model', () => {
  let productOne;
  let productTwo;

  beforeEach(async () => {
    jest.clearAllMocks();

    productOne = await new productModel({
      name: 'product',
      slug: slugify('product'),
      description: 'product',
      price: 100,
      category: categoryId,
      quantity: 100,
      photo: {
        // https://chatgpt.com/share/67af4982-89b8-8004-a111-9daee97b5a96
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    }).save();

    productTwo = await new productModel({
      name: 'product',
      slug: slugify('product'),
      description: 'product',
      price: 200,
      category: categoryId,
      quantity: 200,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
        contentType: 'image/png',
      },
      shipping: true,
    }).save();
  });

  afterEach(async () => {
    await productModel.deleteMany();
    await mongoose.connection.db.dropDatabase();
  });

  it('should be able to be get all products', async () => {
    await productModel.find({}).then((products) => {
      expect(products.length).toEqual(2);
      expect(products[0].name).toEqual(productOne.name);
      expect(products[0].description).toEqual(productOne.description);
      expect(products[0].price).toEqual(productOne.price);
      expect(products[0].category).toEqual(productOne.category);
      expect(products[0].quantity).toEqual(productOne.quantity);
      expect(products[0].shipping).toEqual(productOne.shipping);
      expect(products[0].photo).toEqual(productOne.photo);

      expect(products[1].name).toEqual(productTwo.name);
      expect(products[1].description).toEqual(productTwo.description);
      expect(products[1].price).toEqual(productTwo.price);
      expect(products[1].category).toEqual(productTwo.category);
      expect(products[1].quantity).toEqual(productTwo.quantity);
      expect(products[1].shipping).toEqual(productTwo.shipping);
      expect(products[1].photo).toEqual(productTwo.photo);
    });
  });

  it('should be able to get a product by id', async () => {
    await productModel.findOne({ _id: productOne._id }).then((product) => {
      expect(product.name).toEqual(productOne.name);
      expect(product.description).toEqual(productOne.description);
      expect(product.price).toEqual(productOne.price);
      expect(product.category).toEqual(productOne.category);
      expect(product.quantity).toEqual(productOne.quantity);
      expect(product.shipping).toEqual(productOne.shipping);
      expect(product.photo).toEqual(productOne.photo);
    });
  });

  it('should be able to create a product', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      slug: slugify('productOther'),
      description: 'productOther',
      price: 300,
      category: categoryId,
      quantity: 300,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    }).save();

    await productModel
      .findOne({
        _id: newProduct._id,
      })
      .then((product) => {
        expect(product.name).toEqual(newProduct.name);
        expect(product.description).toEqual(newProduct.description);
        expect(product.price).toEqual(newProduct.price);
        expect(product.category).toEqual(newProduct.category);
        expect(product.quantity).toEqual(newProduct.quantity);
        expect(product.shipping).toEqual(newProduct.shipping);
        expect(product.photo).toEqual(newProduct.photo);
      });
  });

  it('should be able to delete a product', async () => {
    await productModel.deleteOne({ _id: productOne._id });

    await productModel.findOne({ _id: productOne._id }).then((product) => {
      expect(product).toBeNull();
    });
  });

  it('should be able to create a product without a photo', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      slug: slugify('productOther'),
      description: 'productOther',
      price: 300,
      category: categoryId,
      quantity: 300,
      shipping: true,
    }).save();

    await productModel
      .findOne({
        _id: newProduct._id,
      })
      .then((product) => {
        expect(product.name).toEqual(newProduct.name);
        expect(product.description).toEqual(newProduct.description);
        expect(product.price).toEqual(newProduct.price);
        expect(product.category).toEqual(newProduct.category);
        expect(product.quantity).toEqual(newProduct.quantity);
        expect(product.shipping).toEqual(newProduct.shipping);
      });
  });

  it('should be able to create a product without shipping information', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      slug: slugify('productOther'),
      description: 'productOther',
      price: 300,
      category: categoryId,
      quantity: 300,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
    }).save();

    await productModel
      .findOne({
        _id: newProduct._id,
      })
      .then((product) => {
        expect(product.name).toEqual(newProduct.name);
        expect(product.description).toEqual(newProduct.description);
        expect(product.price).toEqual(newProduct.price);
        expect(product.category).toEqual(newProduct.category);
        expect(product.quantity).toEqual(newProduct.quantity);
        expect(product.photo).toEqual(newProduct.photo);
      });
  });

  it('should be able to update a product', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      slug: slugify('productOther'),
      description: 'productOther',
      price: 300,
      category: categoryId,
      quantity: 300,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    }).save();

    await productModel.findOneAndUpdate(
      {
        _id: newProduct._id,
      },
      {
        description: 'productOtherUpdated',
        price: 500,
      }
    );

    await productModel
      .findOne({
        _id: newProduct._id,
      })
      .then((product) => {
        expect(product.name).toEqual(newProduct.name);
        expect(product.description).toEqual('productOtherUpdated');
        expect(product.price).toEqual(500);
        expect(product.category).toEqual(newProduct.category);
        expect(product.quantity).toEqual(newProduct.quantity);
        expect(product.shipping).toEqual(newProduct.shipping);
        expect(product.photo).toEqual(newProduct.photo);
      });
  });

  it('should error out if name is not provided', async () => {
    const newProduct = await new productModel({
      slug: slugify('productOther'),
      description: 'productOther',
      price: 300,
      category: categoryId,
      quantity: 300,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    })
      .save()
      .catch((error) => {
        expect(error).toBeInstanceOf(Error);
      });
  });

  it('should error out if slug is not provided', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      description: 'productOther',
      price: 300,
      category: categoryId,
      quantity: 300,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    })
      .save()
      .catch((error) => {
        expect(error).toBeInstanceOf(Error);
      });
  });

  it('should error out if description is not provided', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      slug: slugify('productOther'),
      price: 300,
      category: categoryId,
      quantity: 300,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    })
      .save()
      .catch((error) => {
        expect(error).toBeInstanceOf(Error);
      });
  });

  it('should error out if price is not provided', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      slug: slugify('productOther'),
      description: 'productOther',
      category: categoryId,
      quantity: 300,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    })
      .save()
      .catch((error) => {
        expect(error).toBeInstanceOf(Error);
      });
  });

  it('should error out if category is not provided', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      slug: slugify('productOther'),
      description: 'productOther',
      price: 300,
      quantity: 300,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    })
      .save()
      .catch((error) => {
        expect(error).toBeInstanceOf(Error);
      });
  });

  it('should error out if quantity is not provided', async () => {
    const newProduct = await new productModel({
      name: 'productOther',
      slug: slugify('productOther'),
      description: 'productOther',
      price: 300,
      category: categoryId,
      photo: {
        data: {
          data: [1, 2, 3, 4],
          type: 'Buffer',
        },
      },
      shipping: true,
    })
      .save()
      .catch((error) => {
        expect(error).toBeInstanceOf(Error);
      });
  });
});
