import actionTypes from '../interfaces/actionTypes';
import { MapAction } from '../interfaces/ContextType';
import MapType from '../interfaces/MapType';

export const initialMap: MapType = {
  gmap: null,
  isLoading: false,
  error: null,
};

export const mapReducer = (state: MapType, action: MapAction): MapType => {
  const { type, payload } = action;
  switch (type) {
    case actionTypes.SET_MAP:
      return { ...state, gmap: payload?.gmap ?? null, isLoading: false, error: null };
    case actionTypes.CLEAR_MAP:
      return { ...initialMap };
    case actionTypes.SET_ERROR:
      return { ...state, isLoading: false, error: payload?.error ?? 'Unknown error' };
    default:
      return state;
  }
};
