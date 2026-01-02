import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

export function registerBuildTools(server: McpServer) {
    // Run Build
    server.tool(
        "sb_backend_run_build",
        "Run the build script (npm run build).",
        {
            cwd: z.string().describe("Project root directory"),
        },
        async ({ cwd }) => {
            try {
                const { stdout, stderr } = await execAsync("npm run build", { cwd });
                return {
                    content: [{ type: "text", text: `Build Output:\n${stdout}\n${stderr}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Build Failed:\n${error.message}\n${error.stdout}\n${error.stderr}` }],
                    isError: true,
                };
            }
        }
    );

    // Run Unit Tests
    server.tool(
        "sb_backend_run_unit_tests",
        "Run unit tests (npm test or similar).",
        {
            cwd: z.string().describe("Project root directory"),
        },
        async ({ cwd }) => {
            try {
                const { stdout, stderr } = await execAsync("npm test", { cwd });
                return {
                    content: [{ type: "text", text: `Test Output:\n${stdout}\n${stderr}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Tests Failed:\n${error.message}\n${error.stdout}\n${error.stderr}` }],
                    isError: true,
                };
            }
        }
    );

    // Run Integration Tests
    // Usually a different script, e.g., 'npm run test:integration'
    server.tool(
        "sb_backend_run_integration_tests",
        "Run integration tests.",
        {
            cwd: z.string().describe("Project root directory"),
        },
        async ({ cwd }) => {
            try {
                // Assuming 'test:integration' script exists, fallback to 'test' if strictly needed or error
                const { stdout, stderr } = await execAsync("npm run test:integration", { cwd });
                return {
                    content: [{ type: "text", text: `Integration Test Output:\n${stdout}\n${stderr}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Integration Tests Failed:\n(Ensure 'test:integration' script exists)\n${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Run Arbitrary Command
    server.tool(
        "sb_backend_run_command",
        "Run a shell command.",
        {
            command: z.string().describe("Command to execute"),
            cwd: z.string().describe("Working directory"),
        },
        async ({ command, cwd }) => {
            try {
                const { stdout, stderr } = await execAsync(command, { cwd });
                return {
                    content: [{ type: "text", text: `Output:\n${stdout}\n${stderr}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Command Failed:\n${error.message}\n${error.stdout}\n${error.stderr}` }],
                    isError: true,
                };
            }
        }
    );

    // Read Logs
    server.tool(
        "sb_backend_read_application_logs",
        "Read the last N lines of a log file.",
        {
            logPath: z.string().describe("Path to the log file"),
            lines: z.number().optional().default(50),
        },
        async ({ logPath, lines }) => {
            try {
                // Using tail command for efficiency
                const { stdout } = await execAsync(`tail -n ${lines} "${logPath}"`);
                return {
                    content: [{ type: "text", text: stdout }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error reading logs: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
