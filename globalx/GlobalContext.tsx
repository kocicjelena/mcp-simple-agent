'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useReducer,
  useMemo,
  useCallback,
} from 'react';
import combineReducers from 'react-combine-reducers';
import actionTypes from './actionTypes';
import {
  IContext,
  IContextAction,
  IContextState,
  MapType,
  UserType,
  MessageType,
  ToolType,
  AgentType,
  MapAction,
  UserAction,
  MessageAction,
  ToolAction,
  AgentAction,
  ToolDefinition,
  InstructionPreset,
  Provider as ProviderKind,
} from './ContextType';

// External API helpers (unchanged from your existing context).
import { getMapData } from '../lib/api/mapAPI';
import { loginUser as loginUserAPI } from '../lib/api/userAPI';

/* ================================================================== */
/* Initial states                                                      */
/* ================================================================== */

const initialMap: MapType = {
  gmap: null,
  isLoading: false,
  error: null,
};

const initialUser: UserType = {
  userData: null,
  isAuthenticated: false,
  error: null,
};

const initialMessage: MessageType = {
  messages: [],
  error: null,
};

const initialTool: ToolType = {
  tools: [],
  enabledTools: [],
  isLoading: false,
  error: null,
};

const initialAgent: AgentType = {
  presets: [],
  selectedPresetId: '',
  systemText: '',
  provider: 'ollama',
  model: 'llama3.1',
  error: null,
};

/* ================================================================== */
/* Reducers (inlined, one per slice)                                   */
/* ================================================================== */

const mapReducer = (state: MapType, action: MapAction): MapType => {
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

const userReducer = (state: UserType, action: UserAction): UserType => {
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

const messageReducer = (state: MessageType, action: MessageAction): MessageType => {
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

const toolReducer = (state: ToolType, action: ToolAction): ToolType => {
  const { type, payload } = action;
  switch (type) {
    case actionTypes.SET_TOOL_LOADING:
      return { ...state, isLoading: true, error: null };
    case actionTypes.SET_TOOLS:
      return { ...state, tools: payload?.tools ?? [], isLoading: false, error: null };
    case actionTypes.ADD_TOOL: {
      if (!payload?.tool) return { ...state, isLoading: false };
      // Upsert by name so re-creating a tool replaces rather than duplicates.
      const withoutDup = state.tools.filter((t) => t.name !== payload.tool!.name);
      return {
        ...state,
        tools: [...withoutDup, payload.tool],
        isLoading: false,
        error: null,
      };
    }
    case actionTypes.SET_ENABLED_TOOLS:
      return { ...state, enabledTools: payload?.enabledTools ?? [] };
    case actionTypes.SET_TOOL_ERROR:
      return { ...state, isLoading: false, error: payload?.error ?? 'Unknown error' };
    case actionTypes.CLEAR_TOOLS:
      return { ...initialTool };
    default:
      return state;
  }
};

const agentReducer = (state: AgentType, action: AgentAction): AgentType => {
  const { type, payload } = action;
  switch (type) {
    case actionTypes.SET_INSTRUCTION_PRESETS:
      return { ...state, presets: payload?.presets ?? [], error: null };
    case actionTypes.ADD_INSTRUCTION_PRESET: {
      if (!payload?.preset) return state;
      const withoutDup = state.presets.filter((p) => p.id !== payload.preset!.id);
      return { ...state, presets: [...withoutDup, payload.preset], error: null };
    }
    case actionTypes.SELECT_INSTRUCTION_PRESET: {
      const id = payload?.selectedPresetId ?? '';
      const preset = state.presets.find((p) => p.id === id);
      return {
        ...state,
        selectedPresetId: id,
        // Selecting a preset seeds the editable systemText with its instructions.
        systemText: preset ? preset.instructions : state.systemText,
      };
    }
    case actionTypes.SET_SYSTEM_TEXT:
      return { ...state, systemText: payload?.systemText ?? '' };
    case actionTypes.SET_PROVIDER:
      return { ...state, provider: payload?.provider ?? 'ollama' };
    case actionTypes.SET_MODEL:
      return { ...state, model: payload?.model ?? '' };
    case actionTypes.SET_AGENT_ERROR:
      return { ...state, error: payload?.error ?? 'Unknown error' };
    case actionTypes.CLEAR_AGENT:
      return { ...initialAgent };
    default:
      return state;
  }
};

/* ================================================================== */
/* Combined reducer                                                    */
/* ================================================================== */

const [mainReducer, initialState] = combineReducers({
  map: [mapReducer, initialMap],
  user: [userReducer, initialUser],
  message: [messageReducer, initialMessage],
  tool: [toolReducer, initialTool],
  agent: [agentReducer, initialAgent],
});

/* ================================================================== */
/* Context                                                             */
/* ================================================================== */

const initialContext: IContext = {
  state: initialState as IContextState,
  actions: {
    fetchMap: () => undefined,
    loginUser: () => undefined,
    setMessages: () => undefined,
    addMessage: () => undefined,
    clearMessages: () => undefined,
    createTool: async () => null,
    setEnabledTools: () => undefined,
    clearTools: () => undefined,
    loadInstructionPresets: async () => undefined,
    createInstructionPreset: async () => null,
    selectInstructionPreset: () => undefined,
    setSystemText: () => undefined,
    setProvider: () => undefined,
    setModel: () => undefined,
  },
};

export interface ContextValue {
  state: IContextState;
  actions: IContextAction;
}

export const Context = createContext<ContextValue>(initialContext);

export const Provider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(mainReducer, initialState);

  /* ---------------- map ---------------- */

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

  /* ---------------- user ---------------- */

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

  /* ---------------- message ---------------- */

  const setMessages = useCallback((messages: string[]) => {
    dispatch({ type: actionTypes.SET_MESSAGES, payload: { messages } });
  }, []);

  const addMessage = useCallback((message: string) => {
    dispatch({ type: actionTypes.ADD_MESSAGE, payload: { message } });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_MESSAGES });
  }, []);

  /* ---------------- tool ---------------- */

  // Creation action: the tool-maker component calls this, which POSTs to
  // /api/tool and records the created tool in state on success.
  const createTool = useCallback(async (input: ToolDefinition): Promise<ToolDefinition | null> => {
    dispatch({ type: actionTypes.SET_TOOL_LOADING });
    try {
      const res = await fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create tool');
      }

      const created: ToolDefinition = {
        name: data?.name ?? input.name,
        description: data?.description ?? input.description,
        properties: data?.properties ?? input.properties,
        required: data?.required ?? input.required,
      };

      dispatch({ type: actionTypes.ADD_TOOL, payload: { tool: created } });
      // Enable newly created tools by default for the current conversation.
      dispatch({
        type: actionTypes.SET_ENABLED_TOOLS,
        payload: { enabledTools: [...state.tool.enabledTools, created.name] },
      });
      return created;
    } catch (error) {
      dispatch({ type: actionTypes.SET_TOOL_ERROR, payload: { error: String(error) } });
      return null;
    }
  }, [state.tool.enabledTools]);

  const setEnabledTools = useCallback((names: string[]) => {
    dispatch({ type: actionTypes.SET_ENABLED_TOOLS, payload: { enabledTools: names } });
  }, []);

  const clearTools = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_TOOLS });
  }, []);

  /* ---------------- agent ---------------- */

  const loadInstructionPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/instructions');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to load instructions');
      dispatch({
        type: actionTypes.SET_INSTRUCTION_PRESETS,
        payload: { presets: (data?.instructions ?? []) as InstructionPreset[] },
      });
    } catch (error) {
      dispatch({ type: actionTypes.SET_AGENT_ERROR, payload: { error: String(error) } });
    }
  }, []);

  const createInstructionPreset = useCallback(
    async (input: { name: string; instructions: string }): Promise<InstructionPreset | null> => {
      try {
        const res = await fetch('/api/instructions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Failed to save instructions');

        const preset: InstructionPreset = {
          id: data?.id ?? `instr-${Date.now()}`,
          name: data?.name ?? input.name,
          instructions: data?.instructions ?? input.instructions,
        };
        dispatch({ type: actionTypes.ADD_INSTRUCTION_PRESET, payload: { preset } });
        dispatch({ type: actionTypes.SELECT_INSTRUCTION_PRESET, payload: { selectedPresetId: preset.id } });
        return preset;
      } catch (error) {
        dispatch({ type: actionTypes.SET_AGENT_ERROR, payload: { error: String(error) } });
        return null;
      }
    },
    []
  );

  const selectInstructionPreset = useCallback((id: string) => {
    dispatch({ type: actionTypes.SELECT_INSTRUCTION_PRESET, payload: { selectedPresetId: id } });
  }, []);

  const setSystemText = useCallback((text: string) => {
    dispatch({ type: actionTypes.SET_SYSTEM_TEXT, payload: { systemText: text } });
  }, []);

  const setProvider = useCallback((provider: ProviderKind) => {
    dispatch({ type: actionTypes.SET_PROVIDER, payload: { provider } });
  }, []);

  const setModel = useCallback((model: string) => {
    dispatch({ type: actionTypes.SET_MODEL, payload: { model } });
  }, []);

  /* ---------------- value ---------------- */

  const value = useMemo(
    () => ({
      state: state as IContextState,
      actions: {
        fetchMap,
        loginUser,
        setMessages,
        addMessage,
        clearMessages,
        createTool,
        setEnabledTools,
        clearTools,
        loadInstructionPresets,
        createInstructionPreset,
        selectInstructionPreset,
        setSystemText,
        setProvider,
        setModel,
      },
    }),
    [
      state,
      fetchMap,
      loginUser,
      setMessages,
      addMessage,
      clearMessages,
      createTool,
      setEnabledTools,
      clearTools,
      loadInstructionPresets,
      createInstructionPreset,
      selectInstructionPreset,
      setSystemText,
      setProvider,
      setModel,
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useContextState = () => useContext(Context).state;
export const useContextActions = () => useContext(Context).actions;
