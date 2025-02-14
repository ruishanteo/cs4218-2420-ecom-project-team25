import exp from 'constants';
import {
  brainTreePaymentController,
  braintreeTokenController,
  createProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  productPhotoController,
  relatedProductController,
  searchProductController,
  updateProductController,
} from '../controllers/productController.js';

import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';

import router from '../routes/productRoutes.js';

import express from 'express';
import formidable from 'express-formidable';

// mock the constructor
jest.mock('formidable', () => jest.fn());

jest.mock('../middlewares/authMiddleware', () => ({
  isAdmin: jest.fn((req, res, next) => next()),
  requireSignIn: jest.fn((req, res, next) => next()),
}));

jest.mock('../controllers/productController', () => ({
  brainTreePaymentController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  braintreeTokenController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  createProductController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  deleteProductController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  getProductController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  getSingleProductController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  productCategoryController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  productCountController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  productFiltersController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  productListController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  productPhotoController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  relatedProductController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  searchProductController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  updateProductController: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
}));

// create the express app
// don't need to mock this as we want to test its functionality in
// routing the requests
const app = express();
app.use(express.json());
app.use('/api/v1/product', router);

// create the response object
const response = {
  status: jest.fn(() => response),
  json: jest.fn(),
};

describe('/api/v1/product/braintree/payment', () => {
  //brainTreePaymentController,
  it('should reach the payment controller', async () => {});
});

describe('/api/v1/product/braintree/token', () => {
  // braintreeTokenController,
  it('should reach the token controller', async () => {});
});

describe('/api/v1/product/create-product', () => {
  //   createProductController,
  it('should reach the create product controller', async () => {});
});

describe('/api/v1/product/delete-product/:pid', () => {
  //   deleteProductController,
  it('should reach the delete product controller', async () => {});
});

describe('/api/v1/product/get-product', () => {
  //   getProductController,
  it('should reach the get all product controller', async () => {});
});

describe('/api/v1/product/get-product/:slug', () => {
  //   getSingleProductController,
  it('should reach the get single product controller', async () => {});
});

describe('/api/v1/product/product-category/:slug', () => {
  //   productCategoryController,
  it('should reach the get product category controller', async () => {});
});

describe('/api/v1/product/product-count', () => {
  //   productCountController,
  it('should reach the get product count controller', async () => {});
});

describe('/api/v1/product/product-filters', () => {
  //   productFiltersController,
  it('should reach the product filter controller', async () => {});
});

describe('/api/v1/product/product-list/:page', () => {
  //   productListController,
  it('should reach the product list controller', async () => {});
});

describe('/api/v1/product/product-photo/:pid', () => {
  //   productPhotoController,
  it('should reach the payment controller', async () => {});
});

describe('/api/v1/product/related-product/:pid/:cid', () => {
  //   relatedProductController,
  it('should reach the related products controller', async () => {});
});

describe('/api/v1/product/search/:keyword', () => {
  //   searchProductController,
  it('should reach the search product controller', async () => {});
});

describe('/api/v1/product/update-product/:pid', () => {
  //   updateProductController,
  it('should reach the update product controller', async () => {});
});
