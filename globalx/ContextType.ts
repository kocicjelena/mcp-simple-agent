// interfaces/ContextType.ts
// Central type contract for the consolidated GlobalContext.

/* ---------- shared ---------- */

export type Provider = 'ollama' | 'anthropic';

/* ---------- map slice ---------- */

export interface MapType {
  gmap: unknown | null;
  isLoading: boolean;
  error: string | null;
}

/* ---------- user slice ---------- */

export interface UserData {
  [key: string]: unknown;
}

export interface UserType {
  userData: UserData | null;
  isAuthenticated: boolean;
  error: string | null;
}

/* ---------- message slice ---------- */

export interface MessageType {
  messages: string[];
  error: string | null;
}

/* ---------- tool slice ---------- */

// A tool as created through ToolForm / POST /api/tool.
export interface ToolDefinition {
  name: string;
  description: string;
  properties: Record<string, unknown>;
  required: string[];
}

export interface ToolType {
  tools: ToolDefinition[];   // created/registered tools
  enabledTools: string[];    // names enabled for the current conversation
  isLoading: boolean;
  error: string | null;
}

/* ---------- agent slice ---------- */

export interface InstructionPreset {
  id: string;
  name: string;
  instructions: string;
}

export interface AgentType {
  presets: InstructionPreset[];
  selectedPresetId: string;       // '' = none
  systemText: string;             // editable system prompt (may diverge from preset)
  provider: Provider;
  model: string;
  error: string | null;
}

/* ---------- combined state ---------- */

export interface IContextState {
  map: MapType;
  user: UserType;
  message: MessageType;
  tool: ToolType;
  agent: AgentType;
}

/* ---------- action shapes ---------- */

// A permissive payload keeps each reducer's switch simple while staying typed
// at the slice boundary. Fields are optional; each reducer reads what it needs.
export interface ActionPayload {
  // map
  gmap?: unknown;
  // user
  userData?: UserData | null;
  // message
  messages?: string[];
  message?: string;
  // tool
  tools?: ToolDefinition[];
  tool?: ToolDefinition;
  enabledTools?: string[];
  // agent
  presets?: InstructionPreset[];
  preset?: InstructionPreset;
  selectedPresetId?: string;
  systemText?: string;
  provider?: Provider;
  model?: string;
  // shared
  error?: string | null;
  isLoading?: boolean;
}

export interface GenericAction {
  type: string;
  payload?: ActionPayload;
}

export type MapAction = GenericAction;
export type UserAction = GenericAction;
export type MessageAction = GenericAction;
export type ToolAction = GenericAction;
export type AgentAction = GenericAction;

/* ---------- actions exposed by the Provider ---------- */

export interface IContextAction {
  // map
  fetchMap: (params?: Record<string, unknown>) => void;
  // user
  loginUser: (credentials: { email: string; password: string }) => void;
  // message
  setMessages: (messages: string[]) => void;
  addMessage: (message: string) => void;
  clearMessages: () => void;
  // tool
  createTool: (input: ToolDefinition) => Promise<ToolDefinition | null>;
  setEnabledTools: (names: string[]) => void;
  clearTools: () => void;
  // agent
  loadInstructionPresets: () => Promise<void>;
  createInstructionPreset: (input: { name: string; instructions: string }) => Promise<InstructionPreset | null>;
  selectInstructionPreset: (id: string) => void;
  setSystemText: (text: string) => void;
  setProvider: (provider: Provider) => void;
  setModel: (model: string) => void;
}

export interface IContext {
  state: IContextState;
  actions: IContextAction;
}
