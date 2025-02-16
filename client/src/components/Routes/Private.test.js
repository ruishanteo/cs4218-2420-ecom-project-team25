import React from 'react';
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Spinner from '../Spinner';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import PrivateRoute from './Private';

jest.mock('axios');
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

// need to mock react for useEffect
// https://medium.com/@ashwinKumar0505/how-to-write-unit-test-cases-for-use-effect-react-hooks-using-jest-and-enzyme-5a2a32844a4d
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((fn) => fn()),
  useState: jest.fn(() => [false, jest.fn()]),
}));

describe('Private', () => {
  it('should return Spinner by default if no auth token is present', () => {
    expect(PrivateRoute()).toStrictEqual(<Spinner path='' />);
  });

  it('should return Outlet if auth token is present and authCheck returns false', () => {
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    expect(PrivateRoute()).toStrictEqual(<Spinner path='' />);
  });

  it('should return Spinner if auth token is present and authCheck returns true', () => {
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    useState.mockReturnValueOnce([true, jest.fn()]);

    expect(PrivateRoute()).toStrictEqual(<Outlet />);
  });
});
