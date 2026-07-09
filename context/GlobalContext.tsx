'use client';

import React, {
  createContext, useContext, ReactNode, useReducer, useMemo, useCallback,
} from 'react';
import combineReducers from 'react-combine-reducers';
import { initialMap, mapReducer } from '../reducers/MapReducer';
import { initialUser, userReducer } from '../reducers/UserReducer';
import { initialMessage, messageReducer } from '../reducers/MessageReducer';
import { IContext, IContextAction, IContextState } from '../interfaces/ContextType';
import actionTypes from '../interfaces/actionTypes';
import { getMapData } from '../lib/api/mapAPI';
import { loginUser as loginUserAPI } from '../lib/api/userAPI';

export interface ContextValue {
  state: IContextState;
  actions: IContextAction;
}

const [mainReducer, initialState] = combineReducers({
  map: [mapReducer, initialMap],
  user: [userReducer, initialUser],
  message: [messageReducer, initialMessage],
});

const initialContext: IContext = {
  state: initialState,
  actions: {
    fetchMap: () => undefined,
    loginUser: () => undefined,
    setMessages: () => undefined,
    addMessage: () => undefined,
    clearMessages: () => undefined,
  },
};

export const Context = createContext<ContextValue>(initialContext);

export const Provider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(mainReducer, initialState);
 

  const fetchMap = useCallback(async (params?: Record<string, unknown>) => {
    try {
      const gmap = await getMapData(params);
      if (gmap) {
        dispatch({ type: actionTypes.SET_MAP, payload: { gmap } });
      }
    } catch (error) {
      console.error('[fetchMap]', error);
    }
  }, []);

  const loginUser = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const userData = await loginUserAPI(credentials);
      if (userData) {
        dispatch({ type: actionTypes.SET_USER, payload: { userData } });
       
      }
    } catch (error) {
      console.error('[loginUser]', error);
    }
  }, []);

  const setMessages = useCallback((messages: string[]) => {
    
    dispatch({ type: actionTypes.SET_MESSAGES, payload: { messages } });
  }, []);

  const addMessage = useCallback((message: string) => {
    dispatch({ type: actionTypes.ADD_MESSAGE, payload: { message } });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_MESSAGES });
  }, []);

  const value = useMemo(
    () => ({ state, actions: { fetchMap, loginUser, setMessages, addMessage, clearMessages } }),
    [state, fetchMap, loginUser, setMessages, addMessage, clearMessages],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useContextState = () => useContext(Context).state;
export const useContextActions = () => useContext(Context).actions;
