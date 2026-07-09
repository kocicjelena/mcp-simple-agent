/* eslint-disable @typescript-eslint/no-explicit-any */
import MapType from './MapType';
import UserType from './UserType';
import MessageType from './MessageType';

export interface IContextState {
  map: MapType;
  user: UserType;
  message: MessageType;
}

export interface IContextAction {
  fetchMap: (params?: Record<string, unknown>) => void;
  loginUser: (credentials: { email: string; password: string }) => void;
  setMessages: (messages: string[]) => void;
  addMessage: (message: string) => void;
  clearMessages: () => void;
}

export interface IContext {
  state: IContextState;
  actions: IContextAction;
}

export interface MapAction {
  type: string;
  payload?: {
    gmap?: any[] | null;
    error?: string | null;
  };
}

export interface UserAction {
  type: string;
  payload?: {
    userData?: UserType['userData'];
    error?: string | null;
  };
}

export interface MessageAction {
  type: string;
  payload?: {
    messages?: string[];
    message?: string;
    error?: string | null;
  };
}
