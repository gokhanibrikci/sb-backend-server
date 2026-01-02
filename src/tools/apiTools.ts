import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";

export function registerApiTools(server: McpServer) {
    // Generic HTTP Request
    server.tool(
        "sb_backend_http_request",
        "Make an HTTP request.",
        {
            method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).describe("HTTP Method"),
            url: z.string().describe("URL"),
            headers: z.record(z.string(), z.string()).optional().describe("Headers"),
            body: z.any().optional().describe("Body (for POST/PUT)"),
        },
        async ({ method, url, headers, body }) => {
            try {
                const response = await axios.request({
                    method,
                    url,
                    headers: headers as any,
                    data: body
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                status: response.status,
                                statusText: response.statusText,
                                data: response.data
                            }, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `HTTP Error: ${error.message}\n${JSON.stringify(error.response?.data || {}, null, 2)}` }],
                    isError: true,
                };
            }
        }
    );

    // Validate API Response
    server.tool(
        "sb_backend_validate_api_response",
        "Validate if a JSON response matches a simplified schema/structure.",
        {
            responseJson: z.string().describe("The JSON string to validate"),
            requiredKeys: z.array(z.string()).describe("List of keys that must exist in the root object"),
        },
        async ({ responseJson, requiredKeys }) => {
            try {
                const data = JSON.parse(responseJson);
                const missing = requiredKeys.filter(k => !(k in data));

                if (missing.length > 0) {
                    return {
                        content: [{ type: "text", text: `Validation Failed. Missing keys: ${missing.join(", ")}` }],
                        isError: true
                    };
                }

                return {
                    content: [{ type: "text", text: "Validation Passed." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Invalid JSON: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // Check Health Endpoint
    server.tool(
        "sb_backend_check_health_endpoint",
        "Check a health endpoint (GET request).",
        {
            url: z.string().describe("Health URL"),
        },
        async ({ url }) => {
            try {
                const start = Date.now();
                const response = await axios.get(url);
                const duration = Date.now() - start;

                return {
                    content: [
                        {
                            type: "text",
                            text: `Status: ${response.status} ${response.statusText}\nDuration: ${duration}ms\nData: ${JSON.stringify(response.data)}`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Health Check Failed: ${error.message}` }],
                    isError: true
                };
            }
        }
    );
}
