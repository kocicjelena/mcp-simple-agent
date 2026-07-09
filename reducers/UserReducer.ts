import actionTypes from '../interfaces/actionTypes';
import { UserAction } from '../interfaces/ContextType';
import UserType from '../interfaces/UserType';

export const initialUser: UserType = {
  userData: null,
  isAuthenticated: false,
  error: null,
};

export const userReducer = (state: UserType, action: UserAction): UserType => {
  const { type, payload } = action;
  switch (type) {
    case actionTypes.SET_USER:
      return {
        ...state,
        userData: payload?.userData ?? null,
        isAuthenticated: !!payload?.userData,
        error: null,
      };
    case actionTypes.CLEAR_USER:
      return { ...initialUser };
    case actionTypes.SET_ERROR:
      return { ...state, error: payload?.error ?? 'Unknown error' };
    default:
      return state;
  }
};
