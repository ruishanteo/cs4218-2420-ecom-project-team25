import fs from 'fs';
import slugify from 'slugify';
import productModel from '../models/productModel';
import categoryModel from '../models/categoryModel';
import orderModel from '../models/orderModel';
import {
  createProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  updateProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
} from './productController';
import braintree from 'braintree';

const token = { token: 'token' };
const txnSuccess = { success: true };

jest.mock('fs');
jest.mock('../models/productModel');
jest.mock('../models/categoryModel');
jest.mock('../models/orderModel');
jest.mock('slugify', () => {
  return jest.fn().mockReturnValue('product');
});
jest.mock('braintree', () => ({
  BraintreeGateway: jest.fn(() => {
    return {
      clientToken: {
        generate: jest.fn(),
      },
      transaction: {
        sale: jest.fn(),
      },
    };
  }),
  Environment: {
    Sandbox: 'sandbox',
  },
}));

// get the gateway object
const gateway = braintree.BraintreeGateway.mock.results[0].value;

let response = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
  set: jest.fn(),
  json: jest.fn(),
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

// spy on console.log to suppress log statements
// we can ignore log statements since the error object is returned to us
// in the API response
let logSpy;

describe('createProductController', () => {
  let request;

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

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

  afterAll(() => {
    logSpy.mockRestore();
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

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error while creating product');

    productModel.prototype.save.mockRejectedValueOnce(error);
    await createProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Error while creating product',
      success: false,
      error: error,
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
    sort: jest.fn().mockResolvedValue(mockedProductQueryData),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    productModel.find.mockReturnValue(mockedProductQuery);
  });

  afterAll(() => {
    logSpy.mockRestore();
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

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error while getting products');

    const mockedProductQuery = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(error),
    };

    productModel.find.mockReturnValue(mockedProductQuery);
    await getProductController({}, response);

    // expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Error while getting products',
      success: false,
      error: error,
    });
  });
});

describe('getSingleProductController', () => {
  const mockedProductQueryData = mockedProductData;

  // mock the query object
  const mockedProductQuery = {
    findOne: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockResolvedValue(mockedProductQueryData),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    productModel.findOne.mockReturnValue(mockedProductQuery);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should get a single product', async () => {
    await getSingleProductController({ params: { slug: 'product' } }, response);

    // expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      message: 'Single Product Fetched',
      product: mockedProductQueryData,
    });
  });

  it('should error out if an error is thrown', async () => {
    const error = new Error('Error while getting single product');

    const mockedProductQuery = {
      findOne: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(error),
    };

    productModel.findOne.mockReturnValue(mockedProductQuery);
    await getSingleProductController({ params: { slug: 'product' } }, response);

    // expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Error while getitng single product',
      success: false,
      error: error,
    });
  });
});

describe('productPhotoController', () => {
  const mockedProductQueryData = {
    photo: {
      data: Buffer.from([1, 2, 3, 4]),
      contentType: 'image/png',
    },
  };

  const missingDataQueryData = {
    photo: {
      contentType: 'image/png',
    },
  };

  // mock the query object
  const mockedProductQuery = {
    findById: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(mockedProductQueryData),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    productModel.findById.mockReturnValue(mockedProductQuery);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should retrieve a product photo', async () => {
    await productPhotoController({ params: { pid: '123' } }, response);

    expect(response.set).toHaveBeenCalledWith('Content-type', 'image/png');
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith(
      mockedProductQueryData.photo.data
    );
  });

  it('should error out when photo data is missing', async () => {
    const mockedProductQuery = {
      findById: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(missingDataQueryData),
    };

    productModel.findById.mockReturnValue(mockedProductQuery);
    await productPhotoController({ params: { pid: '123' } }, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Photo not found',
      success: false,
    });
  });

  it('should error out if an error is thrown', async () => {
    const error = new Error('Error while getting photo');

    const mockedProductQuery = {
      findById: jest.fn().mockReturnThis(),
      select: jest.fn().mockRejectedValue(error),
    };

    productModel.findById.mockReturnValue(mockedProductQuery);
    await productPhotoController({ params: { pid: '123' } }, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Error while getting photo',
      success: false,
      error: error,
    });
  });
});

describe('deleteProductController', () => {
  const mockedProductQuery = {
    findByIdAndDelete: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    productModel.findByIdAndDelete.mockReturnValue(mockedProductQuery);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should delete a product', async () => {
    await deleteProductController({ params: { pid: '123' } }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product Deleted Successfully',
    });
  });

  it('should error out if an error is thrown', async () => {
    const error = new Error('Error while deleting product');

    const mockedProductQuery = {
      findByIdAndDelete: jest.fn().mockReturnThis(),
      select: jest.fn((...args) => {
        throw error;
      }),
    };

    productModel.findByIdAndDelete.mockReturnValue(mockedProductQuery);
    await deleteProductController({ params: { pid: '123' } }, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Error while deleting product',
      success: false,
      error: error,
    });
  });
});

describe('updateProductController', () => {
  let request;

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const mockedProductQuery = {
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockedProductData),
      save: jest.fn().mockResolvedValue(mockedProductData),
    };

    productModel.findByIdAndUpdate.mockReturnValue(mockedProductQuery);

    request = {
      params: { pid: '123' },
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

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should update a product', async () => {
    await updateProductController(request, response);

    // expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: mockedProductData,
      message: 'Product Updated Successfully',
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

    const mockedProductQuery = {
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockedProductData),
      save: jest.fn().mockResolvedValue(mockedProductData),
    };

    productModel.findByIdAndUpdate.mockResolvedValueOnce(mockedProductQuery);
    productModel.prototype.save.mockResolvedValueOnce(mockedProductData);
    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: mockedProductData,
      message: 'Product Updated Successfully',
    });
  });

  it('should error out when name is missing', async () => {
    request.fields.name = null;

    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({ error: 'Name is Required' });
  });

  it('should error out when description is missing', async () => {
    request.fields.description = null;

    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: 'Description is Required',
    });
  });

  it('should error out when price is missing', async () => {
    request.fields.price = null;

    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({ error: 'Price is Required' });
  });

  it('should error out when category is missing', async () => {
    request.fields.category = null;

    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: 'Category is Required',
    });
  });

  it('should error out when quantity is missing', async () => {
    request.fields.quantity = null;

    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: 'Quantity is Required',
    });
  });

  it('should not error out when photo is missing', async () => {
    request.files.photo = null;

    const mockedProductData = {
      pid: '123',
      name: 'product',
      slug: 'product',
      description: 'product description',
      price: 100,
      category: '123',
      quantity: 10,
      shipping: true,
    };

    const mockedProductQuery = {
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockedProductData),
      save: jest.fn().mockResolvedValue(mockedProductData),
    };

    productModel.findByIdAndUpdate.mockResolvedValueOnce(mockedProductQuery);
    productModel.prototype.save.mockResolvedValueOnce(mockedProductData);
    await updateProductController(request, response);

    // expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Product Updated Successfully',
      products: mockedProductData,
      success: true,
    });
  });

  it('should not error out when photo is small enough', async () => {
    request.files.photo.size = 1000;

    productModel.prototype.save.mockResolvedValueOnce(mockedProductData);
    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Product Updated Successfully',
      products: mockedProductData,
      success: true,
    });
  });

  it('should error out when photo is too large', async () => {
    request.files.photo.size = 1000001;

    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      error: 'photo is Required and should be less then 1mb',
    });
  });

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error while updating product');

    const mockedProductQuery = {
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      save: jest.fn().mockRejectedValue(error),
    };

    productModel.findByIdAndUpdate.mockReturnValue(mockedProductQuery);
    await updateProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      message: 'Error while updating product',
      success: false,
      error: error,
    });
  });
});

describe('productFiltersController', () => {
  let request;

  const mockedProductQueryData = [mockedProductData];

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    request = {
      body: {
        checked: ['category 1', 'category 2'],
        radio: [10, 20],
      },
    };

    productModel.find.mockResolvedValue(mockedProductQueryData);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should filter available products', async () => {
    await productFiltersController(request, response);

    // expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: mockedProductQueryData,
    });
  });

  it('should still filter if checked is missing', async () => {
    request.body.checked = [];

    await productFiltersController(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: mockedProductQueryData,
    });
  });

  it('should still filter if radio is missing', async () => {
    request.body.radio = [];

    await productFiltersController(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: mockedProductQueryData,
    });
  });

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error while filtering products');

    productModel.find.mockRejectedValueOnce(error);
    await productFiltersController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error while filtering products',
      error: error,
    });
  });
});

describe('productCountController', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should get count of specified products', async () => {
    const mockedProductQuery = {
      find: jest.fn().mockReturnThis(),
      estimatedDocumentCount: jest.fn().mockResolvedValue(10),
    };

    productModel.find.mockReturnValue(mockedProductQuery);

    await productCountController({}, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      total: 10,
    });
  });

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error in product count');

    const mockedProductQuery = {
      find: jest.fn().mockReturnThis(),
      estimatedDocumentCount: jest.fn().mockRejectedValue(error),
    };

    productModel.find.mockReturnValue(mockedProductQuery);

    await productCountController({}, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error in product count',
      error: error,
    });
  });
});

describe('productListController', () => {
  let mockedProductQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mockedProductQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockedProductData]),
      sort: jest.fn().mockReturnThis(),
    };
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should list all products on a page with page specified', async () => {
    productModel.find.mockReturnValue(mockedProductQuery);

    await productListController({ query: { page: 1 } }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: [mockedProductData],
      hasMore: false,
    });
  });

  it('should list all products on a page without page specified', async () => {
    productModel.find.mockReturnValue(mockedProductQuery);

    await productListController({ query: {} }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: [mockedProductData],
      hasMore: false,
    });
  });

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error thrown');

    // modify the query object
    mockedProductQuery.limit = jest.fn().mockRejectedValue(error);

    productModel.find.mockReturnValue(mockedProductQuery);

    await productListController({ query: { page: 1 } }, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error in pagination control',
      error: error,
    });
  });

  it('should apply filters when filters are specified', async () => {
    const filters = {
      page: 2,
      minPrice: 10,
      maxPrice: 20,
      categories: '1'
    };

    productModel.find.mockReturnValue(mockedProductQuery);

    await productListController({ query: { ...filters } }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: [mockedProductData],
      hasMore: false,
    });
    expect(productModel.find).toHaveBeenCalledWith({
      category: ['1'],
      price: { $gte: 10, $lte: 20 },
    });
  });

  it('should apply minPrice filter when minPrice is specified', async () => {
    const filters = {
      page: 2,
      minPrice: 10,
    };

    productModel.find.mockReturnValue(mockedProductQuery);

    await productListController({ query: { ...filters } }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: [mockedProductData],
      hasMore: false,
    });
    expect(productModel.find).toHaveBeenCalledWith({
      price: { $gte: 10 },
    });
  });

  it('should apply maxPrice filter when maxPrice is specified', async () => {
    const filters = {
      page: 2,
      maxPrice: 20,
    };

    productModel.find.mockReturnValue(mockedProductQuery);

    await productListController({ query: { ...filters } }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: [mockedProductData],
      hasMore: false,
    });
    expect(productModel.find).toHaveBeenCalledWith({
      price: { $lte: 20 },
    });
  });
});

describe('searchProductController', () => {
  const mockedProductQueryData = [mockedProductData];

  let mockedProductQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mockedProductQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(mockedProductQueryData),
    };

    productModel.find.mockReturnValue(mockedProductQuery);
  });

  it('should retrieve queried product', async () => {
    const request = {
      params: {
        keyword: 'product',
      },
    };

    await searchProductController(request, response);

    expect(response.json).toHaveBeenCalledWith(mockedProductQueryData);
  });

  it('should error out when an error is thrown', async () => {
    const request = {
      params: {
        keyword: 'product',
      },
    };
    const error = new Error('Error In Search Product API');

    mockedProductQuery.select = jest.fn().mockRejectedValue(error);

    await searchProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error In Search Product API',
      error: error,
    });
  });
});

describe('relatedProductController', () => {
  const mockedProductQueryData = [mockedProductData];

  let mockedProductQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedProductQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockedProductQueryData),
    };

    productModel.find.mockReturnValue(mockedProductQuery);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should retrieve all related products', async () => {
    const request = {
      params: {
        pid: '123',
        cid: '123',
      },
    };

    await relatedProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      products: mockedProductQueryData,
    });
  });

  it('should throw an error when an error is thrown', async () => {
    const error = new Error('Error while geting related product');
    const request = {
      params: {
        pid: '123',
        cid: '123',
      },
    };

    mockedProductQuery.populate = jest.fn().mockRejectedValue(error);

    await relatedProductController(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error while geting related product',
      error: error,
    });
  });
});

describe('productCategoryController', () => {
  let request;

  beforeEach(() => {
    jest.clearAllMocks();

    request = {
      params: {
        slug: 'product',
      },
    };

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should return category of the requested item', async () => {
    const productModelQuery = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([mockedProductData]),
    };
    const categoryModelQueryData = { name: 'category', slug: 'products' };

    categoryModel.findOne.mockResolvedValue(categoryModelQueryData);
    productModel.find.mockReturnValue(productModelQuery);

    await productCategoryController(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith({
      success: true,
      category: categoryModelQueryData,
      products: [mockedProductData],
    });
  });

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error while getting products');

    categoryModel.findOne.mockRejectedValue(error);
    await productCategoryController(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error while getting products',
      error: error,
    });
  });
});

// idea for mocking the gateway is taken from
// chatgpt: https://chatgpt.com/share/67a8d565-5ddc-8004-8522-f250a6e2817b
describe('braintreeTokenController', () => {
  let request;

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    request = {};
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should obtain braintree controller token', async () => {
    gateway.clientToken.generate.mockImplementationOnce((_, callback) => {
      callback(null, token);
    });

    await braintreeTokenController(request, response);

    expect(response.send).toHaveBeenCalledWith(token);
  });

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error while getting token');

    gateway.clientToken.generate.mockImplementationOnce((_, callback) => {
      callback(error, null);
    });

    await braintreeTokenController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith(error);
  });

  // https://krasimirtsonev.com/blog/article/jest-mock-console-methods
  it('should trigger a console log when generate() errors out', async () => {
    const error = new Error('Error while getting token');
    const log = jest.spyOn(console, 'log').mockImplementationOnce(() => {});

    gateway.clientToken.generate.mockImplementationOnce((_, callback) => {
      throw error;
    });

    await braintreeTokenController(request, response);

    expect(log).toBeCalledWith(error);
  });
});

describe('brainTreePaymentController', () => {
  let request;

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    request = {
      body: {
        nonce: 'nonce',
        cart: [mockedProductData],
      },
      user: {
        _id: '123',
      },
    };

    orderModel.prototype.save.mockResolvedValue(txnSuccess);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should be able to make payment', async () => {
    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      callback(null, txnSuccess);
    });

    await brainTreePaymentController(request, response);

    expect(response.json).toHaveBeenCalledWith({ ok: true });
  });

  it('should error out when an error is thrown', async () => {
    const error = new Error('Error while getting token');

    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      callback(error, null);
    });

    await brainTreePaymentController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith(error);
  });

  // https://krasimirtsonev.com/blog/article/jest-mock-console-methods
  it('should trigger a console log when sale() errors out', async () => {
    const error = new Error('Error while getting token');
    const log = jest.spyOn(console, 'log').mockImplementationOnce(() => {});

    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      throw error;
    });

    await brainTreePaymentController(request, response);

    expect(log).toBeCalledWith(error);
  });
});
