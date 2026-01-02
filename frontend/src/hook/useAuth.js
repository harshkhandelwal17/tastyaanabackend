// src/hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loginSuccess, logout } from '../redux/authslice';
import { useGetProfileQuery } from '../redux/storee/api';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  
  const { data: profileData, error, isLoading } = useGetProfileQuery(undefined, {
    skip: !token
  });

  useEffect(() => {
    if (token && profileData) {
      dispatch(loginSuccess({
        user: profileData.data,
        token
      }));
    } else if (error) {
      dispatch(logout());
    }
  }, [profileData, error, token, dispatch]);

  const login = (userData, authToken) => {
    dispatch(loginSuccess({
      user: userData,
      token: authToken
    }));
  };

  const signOut = () => {
    dispatch(logout());
  };
  console.log(user, "inside the useAuth hook ");
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout: signOut
  };
};