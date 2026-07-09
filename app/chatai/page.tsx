import AgentChat from "@/components/tool-agent/AgentChat";

export default function AgentChatPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Agent Chat</h1>
      <p style={{ color: "#555" }}>
        Chat with tools and instructions. Switch between local Ollama models and Anthropic
        Claude, choose an instruction preset, and pick which registered MCP tools the agent
        may use for this conversation.
      </p>
      <AgentChat />
    </main>
  );
}
