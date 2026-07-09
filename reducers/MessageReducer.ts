import actionTypes from '../interfaces/actionTypes';
import { MessageAction } from '../interfaces/ContextType';
import MessageType from '../interfaces/MessageType';

export const initialMessage: MessageType = {
  messages: [],
  error: null,
};

export const messageReducer = (state: MessageType, action: MessageAction): MessageType => {
  const { type, payload } = action;
  switch (type) {
    case actionTypes.SET_MESSAGES:
      return { ...state, messages: payload?.messages ?? [], error: null };
    case actionTypes.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, payload?.message ?? ''], error: null };
    case actionTypes.CLEAR_MESSAGES:
      return { ...initialMessage };
    case actionTypes.SET_ERROR:
      return { ...state, error: payload?.error ?? 'Unknown error' };
    default:
      return state;
  }
};
