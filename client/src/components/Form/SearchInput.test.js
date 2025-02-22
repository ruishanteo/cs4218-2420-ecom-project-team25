import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import SearchInput from './SearchInput';

jest.mock('axios');

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]),
}));

describe('SearchInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render search input', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path='/' element={<SearchInput />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('inputs should be initially empty', () => {
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Search').value).toBe('');
  });

  it('should allow typing search keyword', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path='/' element={<SearchInput />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'test search' },
    });
  });

  it('should submit the form', async () => {
    axios.get.mockResolvedValueOnce({
      data: [],
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path='/' element={<SearchInput />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'test search' },
    });

    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  it('should log error if an error occurs', async () => {
    // purposefully not mock the axios.get to get a destructuring error
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const log = jest.spyOn(console, 'log').mockImplementationOnce(() => {});

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'test search' },
    });

    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(log).toHaveBeenCalled();
  });
});
