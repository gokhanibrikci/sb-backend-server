import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function registerCiTools(server: McpServer) {
    // Read CI Pipeline (Generic - could be local file (.gitlab-ci.yml) or just concept)
    server.tool(
        "sb_backend_read_ci_pipeline",
        "Read the CI configuration file (e.g., .gitlab-ci.yml).",
        {
            repoPath: z.string().describe("Repository Path"),
        },
        async ({ repoPath }) => {
            try {
                // Try common names
                const cmd = `cat .gitlab-ci.yml || cat .github/workflows/*.yml || echo "No standard CI file found"`;
                const { stdout } = await execAsync(cmd, { cwd: repoPath });
                return {
                    content: [{ type: "text", text: stdout }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error reading CI config: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Analyze Pipeline Failure is largely covered by 'gitlab_get_job_failure' but we can add a generic one
    server.tool(
        "sb_backend_analyze_pipeline_failure",
        "Analyze a failed pipeline log provided as text.",
        {
            logContent: z.string().describe("The log content to analyze"),
        },
        async ({ logContent }) => {
            // Simple keyword search
            const commonErrors = ["Error:", "Failed:", "Exception", "Timeout"];
            const lines = logContent.split('\n');
            const findings = lines.filter(l => commonErrors.some(err => l.includes(err)));

            return {
                content: [{
                    type: "text",
                    text: findings.length > 0
                        ? `Potential Issues Found:\n${findings.slice(0, 10).join('\n')}`
                        : "No obvious common errors found in the snippet."
                }],
            };
        }
    );

    // Scan Dependencies
    server.tool(
        "sb_backend_scan_dependencies",
        "Run a security scan on dependencies (npm audit).",
        {
            cwd: z.string().describe("Project directory"),
        },
        async ({ cwd }) => {
            try {
                // npm audit returns non-zero exit code if vulnerabilities found, so we catch error
                const { stdout } = await execAsync("npm audit", { cwd });
                return {
                    content: [{ type: "text", text: stdout }],
                };
            } catch (error: any) {
                // stdout usually contains the report even on error
                return {
                    content: [{ type: "text", text: `Vulnerabilities Found:\n${error.stdout || error.message}` }],
                };
            }
        }
    );
}
