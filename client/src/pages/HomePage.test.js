import '@testing-library/jest-dom/extend-expect';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useNavigate, MemoryRouter, Routes, Route } from 'react-router-dom'; // covered
import { Checkbox, Radio } from 'antd';
import { Prices } from '../components/Prices';
import { useCart } from '../context/cart'; // covered
import axios from 'axios'; // covered
import toast from 'react-hot-toast'; // covered
import Layout from './../components/Layout';
import { AiOutlineReload } from 'react-icons/ai';
import '../styles/Homepages.css';
import HomePage from './HomePage';
import exp from 'constants';

// reused from CategoryProduct.test.js
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]),
}));

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Home Page', () => {
  // reused from CategoryProduct.test.js
  const mockedProductsPageOne = {
    data: {
      products: [
        {
          _id: '1',
          name: 'Test Product 1',
          slug: 'test-product-1',
          description:
            'This is a test product description that is longer than 60 characters to test substring',
          price: 10.99,
          priceString: '$10.99',
        },
        {
          _id: '2',
          name: 'Test Product 2',
          slug: 'test-product-2',
          description:
            'Another test product description that is longer than 60 characters to test substring',
          price: 1149.99,
          priceString: '$1,149.99',
        },
      ],
    },
  };

  const mockedProductsPageTwo = {
    data: {
      products: [
        {
          _id: '3',
          name: 'Test Product 3',
          slug: 'test-product-3',
          description:
            'Yet another test product description that is longer than 60 characters to test substring capabilities',
          price: 199.99,
          priceString: '$199.99',
        },
        {
          _id: '4',
          name: 'Test Product 4',
          slug: 'test-product-4',
          description: 'Short description of product here',
          price: 2222249.99,
          priceString: '$2,222,249.99',
        },
      ],
    },
  };

  const mockedTotalProducts = {
    data: {
      products: [
        ...mockedProductsPageOne.data.products,
        ...mockedProductsPageTwo.data.products,
      ],
    },
  };

  const mockedCategories = {
    data: {
      success: true,
      category: [
        {
          _id: '1',
          name: 'Test Category 1',
          slug: 'test-category-1',
        },
        {
          _id: '2',
          name: 'Test Category 2',
          slug: 'test-category-2',
        },
      ],
    },
  };

  const mockedTotal = {
    data: {
      total:
        mockedProductsPageOne.data.products.length +
        mockedProductsPageTwo.data.products.length,
    },
  };

  const mockedNavigate = jest.fn();

  // reused from CategoryProduct.test.js
  let logSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    useCart.mockReturnValue([[], jest.fn()]);
    useNavigate.mockReturnValue(mockedNavigate);

    // inspired from https://stackoverflow.com/questions/57747392/using-jest-to-mock-multiple-axios-calls
    axios.get.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/category/get-category':
          return Promise.resolve(mockedCategories);
        case '/api/v1/product/product-list/1':
          return Promise.resolve(mockedProductsPageOne);
        case '/api/v1/product/product-list/2':
          return Promise.resolve(mockedProductsPageTwo);
        case '/api/v1/product/product-count':
          return Promise.resolve(mockedTotal);
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    axios.post.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/product/product-filters':
          return Promise.resolve(mockedTotalProducts);
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });
  });

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Adapted from https://stackoverflow.com/questions/55712640/jest-testing-window-location-reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        reload: jest.fn(),
      },
    });

    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(() => {
        return {
          matches: true,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        };
      }),
    });
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should render the Home Page', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    mockedProductsPageOne.data.products.forEach((product) => {
      // assert product name and price is present
      expect(
        screen.getByRole('heading', { name: product.name })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: product.priceString })
      ).toBeInTheDocument();

      // assert product description is present
      expect(
        screen.getByText(`${product.description.substring(0, 60)}...`)
      ).toBeInTheDocument();

      // assert product image is present
      expect(screen.getByAltText(product.name)).toBeInTheDocument();
    });

    const allDetailsButtons = screen.getAllByText('More Details');
    expect(allDetailsButtons.length).toBe(
      mockedProductsPageOne.data.products.length
    );

    const allAddToCartButtons = screen.getAllByText('ADD TO CART');
    expect(allAddToCartButtons.length).toBe(
      mockedProductsPageOne.data.products.length
    );

    // assert that the products are rendered
    expect(screen.getByText('All Products')).toBeInTheDocument();

    // assert that the category boxes have been rendered
    expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();

    // assert that the price filters have been rendered
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('$0 to 19')).toBeInTheDocument();
    expect(screen.getByText('$20 to 39')).toBeInTheDocument();
    expect(screen.getByText('$40 to 59')).toBeInTheDocument();
    expect(screen.getByText('$60 to 79')).toBeInTheDocument();
    expect(screen.getByText('$80 to 99')).toBeInTheDocument();
    expect(screen.getByText('$100 or more')).toBeInTheDocument();
    expect(screen.getByText('RESET FILTERS')).toBeInTheDocument();

    // expect the LoadMore button to be present
    expect(screen.getByText('Loadmore')).toBeInTheDocument();
  });

  it('should render the Next Page of Products', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    // invoke the render of the next page
    fireEvent.click(screen.getByText('Loadmore'));

    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product [34]'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    mockedProductsPageTwo.data.products.forEach((product) => {
      // assert product name and price is present
      expect(
        screen.getByRole('heading', { name: product.name })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: product.priceString })
      ).toBeInTheDocument();

      // assert product description is present
      expect(
        screen.getByText(`${product.description.substring(0, 60)}...`)
      ).toBeInTheDocument();

      // assert product image is present
      expect(screen.getByAltText(product.name)).toBeInTheDocument();
    });

    const allDetailsButtons = screen.getAllByText('More Details');
    expect(allDetailsButtons.length).toBe(
      mockedProductsPageOne.data.products.length +
        mockedProductsPageTwo.data.products.length
    );

    const allAddToCartButtons = screen.getAllByText('ADD TO CART');
    expect(allAddToCartButtons.length).toBe(
      mockedProductsPageOne.data.products.length +
        mockedProductsPageTwo.data.products.length
    );

    // assert that the products are rendered
    expect(screen.getByText('All Products')).toBeInTheDocument();

    // assert that the category boxes have been rendered
    expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();

    // assert that the price filters have been rendered
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('$0 to 19')).toBeInTheDocument();
    expect(screen.getByText('$20 to 39')).toBeInTheDocument();
    expect(screen.getByText('$40 to 59')).toBeInTheDocument();
    expect(screen.getByText('$60 to 79')).toBeInTheDocument();
    expect(screen.getByText('$80 to 99')).toBeInTheDocument();
    expect(screen.getByText('$100 or more')).toBeInTheDocument();
    expect(screen.getByText('RESET FILTERS')).toBeInTheDocument();

    // should not have any more things to load
    expect(screen.queryByText('Loadmore')).toBeNull();
  });

  it('should render no products if there are no products available', async () => {
    // inspired from https://stackoverflow.com/questions/57747392/using-jest-to-mock-multiple-axios-calls
    axios.get.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/category/get-category':
          return Promise.resolve(mockedCategories);
        case '/api/v1/product/product-list/1':
          return Promise.resolve([]);
        case '/api/v1/product/product-list/2':
          return Promise.resolve([]);
        case '/api/v1/product/product-count':
          return Promise.resolve({
            data: {
              total: 0,
            },
          });
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All Products')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    });

    mockedProductsPageOne.data.products.forEach((product) => {
      // assert product name and price is present
      expect(screen.queryByRole('heading', { name: product.name })).toBeNull();
      expect(
        screen.queryByRole('heading', { name: product.priceString })
      ).toBeNull();

      // assert product description is present
      expect(
        screen.queryByRole(`${product.description.substring(0, 60)}...`)
      ).toBeNull();

      // assert product image is present
      expect(screen.queryByAltText(product.name)).toBeNull();
    });

    mockedProductsPageTwo.data.products.forEach((product) => {
      // assert product name and price is present
      expect(screen.queryByRole('heading', { name: product.name })).toBeNull();
      expect(
        screen.queryByRole('heading', { name: product.priceString })
      ).toBeNull();

      // assert product description is present
      expect(
        screen.queryByRole(`${product.description.substring(0, 60)}...`)
      ).toBeNull();

      // assert product image is present
      expect(screen.queryByAltText(product.name)).toBeNull();
    });

    const allDetailsButtons = screen.queryAllByText('More Details');
    expect(allDetailsButtons.length).toBe(0);

    const allAddToCartButtons = screen.queryAllByText('ADD TO CART');
    expect(allAddToCartButtons.length).toBe(0);

    // assert that the products are rendered
    expect(screen.getByText('All Products')).toBeInTheDocument();

    // assert that the category boxes have been rendered
    expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();

    // assert that the price filters have been rendered
    expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    expect(screen.getByText('$0 to 19')).toBeInTheDocument();
    expect(screen.getByText('$20 to 39')).toBeInTheDocument();
    expect(screen.getByText('$40 to 59')).toBeInTheDocument();
    expect(screen.getByText('$60 to 79')).toBeInTheDocument();
    expect(screen.getByText('$80 to 99')).toBeInTheDocument();
    expect(screen.getByText('$100 or more')).toBeInTheDocument();
    expect(screen.getByText('RESET FILTERS')).toBeInTheDocument();

    // expect the LoadMore button to be present
    expect(screen.queryByText('Loadmore')).toBeNull();
  });

  /**
   * Reused from CategoryProduct.test.js
   */
  it('should navigate to product description page if More Details button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    // wait for all the More Details buttons to be rendered
    await waitFor(() => {
      expect(screen.queryAllByText('More Details').length).toBe(2);
    });

    // click the More Details button for the first product
    fireEvent.click(screen.getByTestId('1-more-details-btn'));

    // check if the navigation was successful
    expect(mockedNavigate).toHaveBeenCalledWith(
      `/product/${mockedProductsPageOne.data.products[0].slug}`
    );
  });

  it('should filter products by category', async () => {
    axios.post.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/product/product-filters':
          return Promise.resolve({
            data: {
              products: [
                {
                  _id: '1',
                  name: 'Test Product 2',
                  slug: 'test-product-2',
                  description:
                    'Another test product description that is longer than 60 characters to test substring',
                  price: 1149.99,
                  priceString: '$1,149.99',
                },
              ],
            },
          });
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    await waitFor(() => {
      expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    });

    // click the Test Category 1 filter
    fireEvent.click(screen.getByTestId('1-category-checkbox'));

    // expect the filter function to be called and the filters be applied
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/product/product-filters',
        {
          checked: ['1'],
          radio: [],
        }
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Test Product 1' })
      ).toBeNull();
    });

    expect(
      screen.getByRole('heading', { name: 'Test Product 2' })
    ).toBeInTheDocument();
  });

  it('should unfilter products by category when the checkbox is unchecked', async () => {
    axios.post.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/product/product-filters':
          return Promise.resolve({
            data: {
              products: [
                {
                  _id: '1',
                  name: 'Test Product 2',
                  slug: 'test-product-2',
                  description:
                    'Another test product description that is longer than 60 characters to test substring',
                  price: 1149.99,
                  priceString: '$1,149.99',
                },
              ],
            },
          });
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    await waitFor(() => {
      expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    });

    // click the Test Category 1 filter
    fireEvent.click(screen.getByTestId('1-category-checkbox'));

    // expect the filter function to be called and the filters be applied
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/product/product-filters',
        {
          checked: ['1'],
          radio: [],
        }
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Test Product 1' })
      ).toBeNull();
    });

    expect(
      screen.getByRole('heading', { name: 'Test Product 2' })
    ).toBeInTheDocument();

    // uncheck the Test Category 1 filter
    fireEvent.click(screen.getByTestId('1-category-checkbox'));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Test Product 1' })
      ).not.toBeNull();
    });

    expect(
      screen.getByRole('heading', { name: 'Test Product 2' })
    ).toBeInTheDocument();
  });

  it('should filter products by price', async () => {
    axios.post.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/product/product-filters':
          return Promise.resolve({
            data: {
              products: [
                {
                  _id: '1',
                  name: 'Test Product 2',
                  slug: 'test-product-2',
                  description:
                    'Another test product description that is longer than 60 characters to test substring',
                  price: 1149.99,
                  priceString: '$1,149.99',
                },
              ],
            },
          });
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    // click the price filter
    fireEvent.click(screen.getByText('$100 or more'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/product/product-filters',
        {
          checked: [],
          radio: [100, 9999],
        }
      );
    });

    // wait for the page to re-render with the filtered products
    await waitFor(() => {
      expect(screen.queryAllByText('Test Product 1').length).toBe(0);
    });

    expect(
      screen.getByRole('heading', { name: 'Test Product 2' })
    ).toBeInTheDocument();
  });

  it('should filter products by both category and price', async () => {
    axios.post.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/product/product-filters':
          return Promise.resolve({
            data: {
              products: [
                {
                  _id: '1',
                  name: 'Test Product 2',
                  slug: 'test-product-2',
                  description:
                    'Another test product description that is longer than 60 characters to test substring',
                  price: 1149.99,
                  priceString: '$1,149.99',
                },
              ],
            },
          });
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    await waitFor(() => {
      expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    });

    // click the Test Category 1 filter
    fireEvent.click(screen.getByTestId('1-category-checkbox'));

    // click the price filter
    fireEvent.click(screen.getByText('$100 or more'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/product/product-filters',
        {
          checked: ['1'],
          radio: [100, 9999],
        }
      );
    });

    // wait for the page to re-render with the filtered products
    await waitFor(() => {
      expect(screen.queryAllByText('Test Product 1').length).toBe(0);
    });

    expect(
      screen.getByRole('heading', { name: 'Test Product 2' })
    ).toBeInTheDocument();
  });

  it('should reset filters when Reset Filters button is clicked', async () => {
    axios.post.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/product/product-filters':
          return Promise.resolve({
            data: {
              products: [
                {
                  _id: '1',
                  name: 'Test Product 2',
                  slug: 'test-product-2',
                  description:
                    'Another test product description that is longer than 60 characters to test substring',
                  price: 1149.99,
                  priceString: '$1,149.99',
                },
              ],
            },
          });
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    // click the price filter
    fireEvent.click(screen.getByText('$100 or more'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/product/product-filters',
        {
          checked: [],
          radio: [100, 9999],
        }
      );
    });

    // wait for the page to re-render with the filtered products
    await waitFor(() => {
      expect(screen.queryAllByText('Test Product 1').length).toBe(0);
    });

    // make sure that the filter is working properly
    expect(
      screen.queryByRole('heading', { name: 'Test Product 1' })
    ).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Test Product 2' })
    ).toBeInTheDocument();

    // click the reset filter button
    fireEvent.click(screen.getByText('RESET FILTERS'));

    // make sure it reloads
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should log error if fail to fetch categories', async () => {
    const err = new Error('Failed to fetch categories');

    // inspired from https://stackoverflow.com/questions/57747392/using-jest-to-mock-multiple-axios-calls
    axios.get.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/category/get-category':
          return Promise.reject(err);
        case '/api/v1/product/product-list/1':
          return Promise.resolve(mockedProductsPageOne);
        case '/api/v1/product/product-list/2':
          return Promise.resolve(mockedProductsPageTwo);
        case '/api/v1/product/product-count':
          return Promise.resolve(mockedTotal);
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    });

    expect(logSpy).toHaveBeenCalledWith(err);
  });

  it('should render no categories if success is false when getting all categories', async () => {
    // inspired from https://stackoverflow.com/questions/57747392/using-jest-to-mock-multiple-axios-calls
    axios.get.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/category/get-category':
          return Promise.resolve({
            data: {
              success: false,
              category: mockedCategories.data.category,
            },
          });
        case '/api/v1/product/product-list/1':
          return Promise.resolve(mockedProductsPageOne);
        case '/api/v1/product/product-list/2':
          return Promise.resolve(mockedProductsPageTwo);
        case '/api/v1/product/product-count':
          return Promise.resolve(mockedTotal);
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    });

    // make sure none of the categories render
    expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    expect(screen.queryByText(mockedCategories.data.category[0])).toBeNull();
    expect(screen.queryByText(mockedCategories.data.category[1])).toBeNull();
  });

  it('should log error if fail to fetch products', async () => {
    const err = new Error('Failed to fetch products');

    // inspired from https://stackoverflow.com/questions/57747392/using-jest-to-mock-multiple-axios-calls
    axios.get.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/category/get-category':
          return Promise.resolve(mockedCategories);
        case '/api/v1/product/product-list/1':
          return Promise.reject(err);
        case '/api/v1/product/product-list/2':
          return Promise.reject(err);
        case '/api/v1/product/product-count':
          return Promise.resolve(mockedTotal);
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/1');
    });

    expect(logSpy).toHaveBeenCalledWith(err);
  });

  it('should log error if fail to fetch total product count', async () => {
    const err = new Error('Failed to fetch total product count');

    // inspired from https://stackoverflow.com/questions/57747392/using-jest-to-mock-multiple-axios-calls
    axios.get.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/category/get-category':
          return Promise.resolve(mockedCategories);
        case '/api/v1/product/product-list/1':
          return Promise.resolve(mockedProductsPageOne);
        case '/api/v1/product/product-list/2':
          return Promise.resolve(mockedProductsPageTwo);
        case '/api/v1/product/product-count':
          return Promise.reject(err);
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-count');
    });

    expect(logSpy).toHaveBeenCalledWith(err);
  });

  it('should log error if fail to fetch next page of products', async () => {
    const err = new Error('Failed to fetch total product count');

    axios.get.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/category/get-category':
          return Promise.resolve(mockedCategories);
        case '/api/v1/product/product-list/1':
          return Promise.resolve(mockedProductsPageOne);
        case '/api/v1/product/product-list/2':
          return Promise.reject(err);
        case '/api/v1/product/product-count':
          return Promise.resolve(mockedTotal);
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    // invoke the render of the next page
    fireEvent.click(screen.getByText('Loadmore'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
    });

    expect(logSpy).toHaveBeenCalledWith(err);
  });

  it('should log error if fail to filter products', async () => {
    const err = new Error('Failed to filter products');

    axios.post.mockImplementation((url) => {
      switch (url) {
        case '/api/v1/product/product-filters':
          return Promise.reject(err);
        default:
          return Promise.reject(new Error('URL not found'));
      }
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    // click the price filter
    fireEvent.click(screen.getByText('$100 or more'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/product/product-filters',
        {
          checked: [],
          radio: [100, 9999],
        }
      );
    });

    expect(logSpy).toHaveBeenCalledWith(err);
  });

  /**
   * Reused from CategoryProduct.test.js
   */
  it('should add product to cart when Add to Cart button is clicked', async () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([[], setCart]);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path='/' element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for all the products to be rendered first before continuing with the test
    await waitFor(() => {
      screen
        .getAllByText(new RegExp('Test Product *'), 'i')
        .forEach((product) => {
          expect(product).toBeInTheDocument();
        });
    });

    // click the Add to Cart button for the first product
    const toClick = screen.getByTestId(
      `${mockedProductsPageOne.data.products[0]._id}-add-to-cart-btn`
    );

    // launch the click payload
    fireEvent.click(toClick);

    // make sure that the setCart function was called with the correct product
    expect(setCart).toHaveBeenCalledWith([
      mockedProductsPageOne.data.products[0],
    ]);
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');

    // make sure that localStorage was updated with the correct product
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cart',
        JSON.stringify([mockedProductsPageOne.data.products[0]])
      );
    });
  });
});
