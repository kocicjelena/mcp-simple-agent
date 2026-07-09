interface ATypes {
  SET_MAP: string;
  CLEAR_MAP: string;
  SET_USER: string;
  CLEAR_USER: string;
  SET_MESSAGES: string;
  ADD_MESSAGE: string;
  CLEAR_MESSAGES: string;
  SET_ERROR: string;
}

const actionTypes: ATypes = {
  SET_MAP: 'SET_MAP',
  CLEAR_MAP: 'CLEAR_MAP',
  SET_USER: 'SET_USER',
  CLEAR_USER: 'CLEAR_USER',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_ERROR: 'SET_ERROR',
};

export default actionTypes;
