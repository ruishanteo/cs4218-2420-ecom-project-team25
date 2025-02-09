import fs from 'fs';
import slugify from 'slugify';
import braintree from 'braintree';
import productModel from '../models/productModel';
import categoryModel from '../models/categoryModel';
import orderModel from '../models/orderModel';
import {
  createProductController,
  getProductController,
} from './productController';
import { get } from 'http';
import exp from 'constants';

jest.mock('fs');
jest.mock('../models/productModel');
jest.mock('../models/categoryModel');
jest.mock('../models/orderModel');
jest.mock('slugify', () => {
  return jest.fn().mockReturnValue('product');
});
jest.mock('braintree');

let response = {
  status: jest.fn(() => response),
  send: jest.fn(),
};

let mockedProductData = {
  name: 'product',
  slug: 'product',
  description: 'product description',
  price: 100,
  category: '123',
  quantity: 10,
  photo: {
    data: Buffer.from([1, 2, 3, 4]),
    contentType: 'image/png',
  },
  shipping: true,
};

describe('createProductController', () => {
  let request;

  beforeEach(() => {
    jest.clearAllMocks();

    request = {
      fields: {
        name: 'product',
        description: 'product description',
        price: 100,
        category: '123',
        quantity: 10,
        shipping: true,
      },
      // Formidable photo type
      files: {
        photo: {
          size: 16,
          path: '/tmp/photo.png',
          name: 'photo.png',
          type: 'image/png',
        },
      },
    };

    fs.readFileSync.mockReturnValue(Buffer.from([1, 2, 3, 4]));
    productModel.prototype.save.mockResolvedValue(mockedProductData);
  });

  it('should create a new product', async () => {
    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: mockedProductData,
      message: 'Product Created Successfully',
    });
  });

  it('should create a new product with shipping missing', async () => {
    request.fields.shipping = null;

    const mockedProductData = {
      name: 'product',
      slug: 'product',
      description: 'product description',
      price: 100,
      category: '123',
      quantity: 10,
      photo: {
        data: Buffer.from([1, 2, 3, 4]),
        contentType: 'image/png',
      },
    };

    productModel.prototype.save.mockResolvedValueOnce(mockedProductData);
    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: mockedProductData,
      message: 'Product Created Successfully',
    });
  });

  it('should error out when name is missing', async () => {
    request.fields.name = null;

    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({ error: 'Name is Required' });
  });

  it('should error out when description is missing', async () => {
    request.fields.description = null;

    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: 'Description is Required',
    });
  });

  it('should error out when price is missing', async () => {
    request.fields.price = null;

    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({ error: 'Price is Required' });
  });

  it('should error out when category is missing', async () => {
    request.fields.category = null;

    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: 'Category is Required',
    });
  });

  it('should error out when quantity is missing', async () => {
    request.fields.quantity = null;

    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: 'Quantity is Required',
    });
  });

  it('should not error out when photo is missing', async () => {
    request.files.photo = null;

    const mockedProductData = {
      name: 'product',
      slug: 'product',
      description: 'product description',
      price: 100,
      category: '123',
      quantity: 10,
      shipping: true,
    };

    productModel.prototype.save.mockResolvedValueOnce(mockedProductData);
    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Product Created Successfully',
      products: mockedProductData,
      success: true,
    });
  });

  it('should not error out when photo is small enough', async () => {
    request.files.photo.size = 1000;

    productModel.prototype.save.mockResolvedValueOnce(mockedProductData);
    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Product Created Successfully',
      products: mockedProductData,
      success: true,
    });
  });

  it('should error out when photo is too large', async () => {
    request.files.photo.size = 1000001;

    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: 'photo is Required and should be less then 1mb',
    });
  });
});

describe('getProductController', () => {
  const mockedProductQueryData = [mockedProductData];

  // mock the query object
  const mockedProductQuery = {
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn(() => mockedProductQueryData),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    productModel.find.mockReturnValue(mockedProductQuery);
  });

  it('should get products', async () => {
    await getProductController({}, response);

    // expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      message: 'All Products Fetched',
      counTotal: mockedProductQueryData.length,
      products: mockedProductQueryData,
    });
  });
});

describe('getSingleProductController', () => {
  it('should get a single product', async () => {
    const request = {};
  });
});

describe('productPhotoController', () => {
  it('should should retrieve a product photo', async () => {
    const request = {};
  });
});

describe('deleteProductController', () => {
  it('should delete a product', async () => {
    const request = {};
  });
});

describe('updateProductController', () => {
  it('should update an existing product', async () => {
    const request = {};
  });
});

describe('productFiltersController', () => {
  it('should filter available products', async () => {
    const request = {};
  });
});

describe('productCountController', () => {
  it('should get count of specified products', async () => {
    const request = {};
  });
});

describe('productListController', () => {
  it('should list all products on a page', async () => {
    const request = {};
  });
});

describe('searchProductController', () => {
  it('should retrieve queried product', async () => {
    const request = {};
  });
});

describe('realtedProductController', () => {
  it('should retrieve all related products', async () => {
    const request = {};
  });
});

describe('productCategoryController', () => {
  it('should return category of the requesteed item', async () => {
    const request = {};
  });
});

describe('braintreeTokenController', () => {
  it('should obtain braintree controller token', async () => {
    const request = {};
  });
});

describe('brainTreePaymentController', () => {
  it('should should be able to make payment', async () => {
    const request = {};
  });
});
