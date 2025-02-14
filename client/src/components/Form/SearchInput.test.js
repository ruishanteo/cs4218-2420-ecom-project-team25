import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
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
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    expect(getByPlaceholderText('Search')).toBeInTheDocument();
    expect(getByText('Search')).toBeInTheDocument();
  });

  it('inputs should be initially empty', () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    expect(getByPlaceholderText('Search').value).toBe('');
  });

  it('should allow typing search keyword', () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Search'), { target: { value: 'test search' } });
  });

  it('should submit the form', async () => {
    axios.get.mockResolvedValueOnce({
      data: [],
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );
    

    fireEvent.change(getByPlaceholderText('Search'), {
      target: { value: 'test search' },
    });

    fireEvent.click(getByText('Search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled()
    });
  });

  it('should log error if an error occurs', async () => {
    // purposefully not mock the axios.get to get a destructuring error
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const log = jest.spyOn(console, 'log').mockImplementationOnce(() => {});

    fireEvent.change(getByPlaceholderText('Search'), {
      target: { value: 'test search' },
    });

    fireEvent.click(getByText('Search'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(log).toHaveBeenCalled();
  });
});
