#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
    name: "sb-backend-server",
    version: "1.0.0",
});

// Import tools
import { registerDevTools } from "./tools/devTools.js";
import { registerDbTools } from "./tools/dbTools.js";
import { registerGitlabTools } from "./tools/gitlabTools.js";
import { registerK8sTools } from "./tools/k8sTools.js";
import { registerInstanaTools } from "./tools/instanaTools.js";
import { registerThinkingTools } from "./tools/thinkingTools.js";
import { registerFsTools } from "./tools/fsTools.js";
import { registerBuildTools } from "./tools/buildTools.js";
import { registerApiTools } from "./tools/apiTools.js";
import { registerCiTools } from "./tools/ciTools.js";
import { registerJiraTools } from "./tools/jiraTools.js";

import dotenv from "dotenv";
import path from "path";

// Resolve .env path relative to this file (dist/index.js -> .env)
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Helper to register all tools
async function main() {
    console.error(`Starting SB Backend Server`);

    // Register all backend tools
    registerThinkingTools(server);
    registerFsTools(server);
    registerDevTools(server);
    registerDbTools(server);
    registerGitlabTools(server);
    registerK8sTools(server);
    registerInstanaTools(server);
    registerJiraTools(server);
    registerBuildTools(server);
    registerApiTools(server);
    registerCiTools(server);

    // Basic health check tool
    server.tool(
        "sb_backend_ping",
        "A simple ping tool to check if the server is running.",
        {},
        async () => {
            return {
                content: [
                    {
                        type: "text",
                        text: "pong",
                    },
                ],
            };
        }
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SB Backend Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
