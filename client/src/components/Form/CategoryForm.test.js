import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent, waitFor } from '@testing-library/react';

import CategoryForm from './CategoryForm';

describe('CategoryForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category form', () => {
    const { getByText, getByPlaceholderText } = render(<CategoryForm />);

    // fixed by GitHub Copilot (need to import the extend-expect library)
    expect(getByText('Submit')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter new category')).toBeInTheDocument();
  });

  it('inputs should be initially empty', () => {
    const { getByPlaceholderText } = render(<CategoryForm />);

    expect(getByPlaceholderText('Enter new category').value).toBe('');
  });

  it('should allow typing category', () => {
    const { getByPlaceholderText } = render(
      <CategoryForm setValue={jest.fn()} />
    );

    fireEvent.change(getByPlaceholderText('Enter new category'), {
      target: { value: 'test category' },
    });

    expect(getByPlaceholderText('Enter new category').value).toBe(
      'test category'
    );
  });

  // TODO: might need to mock the form?
  it('should submit the form', async () => {
    // use a mock function to test if the function is invoked when the form is submitted
    // fix for the missing handleSubmit prototype function inspired by: https://stackoverflow.com/questions/62216232/error-not-implemented-htmlformelement-prototype-submit
    const handleSubmit = jest.fn((x) => x.preventDefault());

    // render the component
    const { getByText } = render(<CategoryForm handleSubmit={handleSubmit} />);

    // fire the event
    fireEvent.click(getByText('Submit'));

    // wait for the function to be invoked and check that it is invoked only once
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
