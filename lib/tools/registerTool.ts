/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  McpServer,
  WebStandardStreamableHTTPServerTransport,
} from "@modelcontextprotocol/server";

type SimpleField = {
  type: "string" | "number" | "boolean";
  description?: string;
  enum?: string[];
  optional?: boolean;
};

type SimpleShape = Record<string, SimpleField>;

type SimpleIssue = {
  path: string[];
  message: string;
};

function createObjectSchema(shape: SimpleShape) {
  const properties = Object.fromEntries(
    Object.entries(shape).map(([name, field]) => [
      name,
      {
        type: field.type,
        ...(field.description ? { description: field.description } : {}),
        ...(field.enum ? { enum: field.enum } : {}),
      },
    ])
  );

  const required = Object.entries(shape)
    .filter(([, field]) => !field.optional)
    .map(([name]) => name);

  const jsonSchema = {
    type: "object",
    properties,
    additionalProperties: false,
    ...(required.length > 0 ? { required } : {}),
  };

  return {
    "~standard": {
      version: 1,
      vendor: "nextjs-mcpserver",
      validate: (value: unknown) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return { issues: [{ path: [], message: "Expected an object" }] };
        }

        const input = value as Record<string, unknown>;
        const issues: SimpleIssue[] = [];

        for (const [name, field] of Object.entries(shape)) {
          const fieldValue = input[name];

          if (fieldValue === undefined || fieldValue === null || fieldValue === "") {
            if (!field.optional) {
              issues.push({ path: [name], message: "Required" });
            }
            continue;
          }

          if (typeof fieldValue !== field.type) {
            issues.push({ path: [name], message: `Expected ${field.type}` });
            continue;
          }

          if (field.enum && !field.enum.includes(String(fieldValue))) {
            issues.push({
              path: [name],
              message: `Expected one of: ${field.enum.join(", ")}`,
            });
          }
        }

        if (issues.length > 0) {
          return { issues };
        }

        return { value: input };
      },
      jsonSchema: {
        input: () => jsonSchema,
        output: () => jsonSchema,
      },
    },
  };
}

function registerTool(
  server: McpServer,
  name: string,
  config: Record<string, unknown>,
  handler: unknown
) {
  server.registerTool(name, config as any, handler as any);
}
export function registerServerTool(server: McpServer, name: string, config: Record<string, unknown>, handler: unknown) {
  registerTool(server, name, config, handler);
}
