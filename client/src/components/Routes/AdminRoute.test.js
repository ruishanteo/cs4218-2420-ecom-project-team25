import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import AdminRoute from './AdminRoute';
import { render, waitFor, screen } from '@testing-library/react';

jest.mock('axios');
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
  Outlet: jest.fn(() => <div data-testid="outlet" />),
}));

let consoleSpy;

describe('AdminRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  // reuses Header.test.js
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should return RedirectSpinner by default if no auth token is present', async () => {
    useAuth.mockReturnValueOnce([{}, jest.fn()]);

    render(<AdminRoute />);

    expect(screen.getByTestId('redirect-spinner')).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  it('should return RedirectSpinner if auth token is present and authCheck returns false when rendered', async () => {
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    render(<AdminRoute />);

    await waitFor(() => {
      expect(screen.getByTestId('redirect-spinner')).toBeInTheDocument();
    });
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should return loading Spinner by default if auth token is present when rendered', async () => {
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    render(<AdminRoute />);

    await waitFor(() => {
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  it('should return Outlet if auth token is present and authCheck returns true', async () => {
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    render(<AdminRoute />);

    await waitFor(() => {
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  it('should not crash if get errors out', async () => {
    const err = new Error('Failed to query auth status');
    axios.get.mockRejectedValueOnce(err);
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);

    render(<AdminRoute />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(err);
    });
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth');
  });
});
