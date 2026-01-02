import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";

export function registerInstanaTools(server: McpServer) {
    const INSTANA_API_URL = process.env.INSTANA_API_URL;
    const INSTANA_API_TOKEN = process.env.INSTANA_API_TOKEN;

    async function instanaRequest(path: string) {
        if (!INSTANA_API_URL || !INSTANA_API_TOKEN) {
            throw new Error("INSTANA_API_URL or INSTANA_API_TOKEN env var is not set.");
        }
        const response = await axios.get(`${INSTANA_API_URL}${path}`, {
            headers: { Authorization: `apiToken ${INSTANA_API_TOKEN}` },
        });
        return response.data;
    }

    server.tool(
        "sb_backend_instana_get_alerts",
        "Get active problems/alerts from Instana.",
        {
            limit: z.number().optional().default(5),
        },
        async ({ limit }) => {
            try {
                // Mocking the Instana V2 API structure roughly
                // Real path usually: /api/events?state=OPEN
                const data = await instanaRequest('/api/events?state=OPEN');

                // Assume data is an array of events
                const events = Array.isArray(data) ? data : [];
                if (events.length === 0) {
                    return {
                        content: [{ type: "text", text: "No open alerts found in Instana." }],
                    };
                }

                const summary = events.slice(0, limit).map((e: any) =>
                    `[${e.severity}] ${e.title || e.problemDescription} (Start: ${e.startTime})`
                ).join("\n");

                return {
                    content: [{ type: "text", text: summary }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Instana Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // List Services
    server.tool(
        "sb_backend_instana_list_services",
        "List application services.",
        {},
        async () => {
            try {
                const data = await instanaRequest('/api/application-monitoring/services?windowSize=300000');
                // Mock response processing
                const items = Array.isArray(data?.items) ? data.items : [];
                const list = items.slice(0, 10).map((s: any) => `ID: ${s.id} | Label: ${s.label}`).join("\n");
                return {
                    content: [{ type: "text", text: list || "No services found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Instana Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Helper for time window
    const getWindow = () => `windowSize=300000`; // 5 mins

    // Service Health (Mocked metrics)
    server.tool(
        "sb_backend_instana_service_health",
        "Get health/metrics for a service.",
        {
            serviceId: z.string().describe("Service ID"),
        },
        async ({ serviceId }) => {
            try {
                // Real path: /api/application-monitoring/metrics/services/{id}/metrics
                // We'll mock asking for errors and calls
                const path = `/api/application-monitoring/metrics/services/${serviceId}/metrics?metric=calls&metric=errors&${getWindow()}`;
                const data = await instanaRequest(path);
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Instana Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Alias for more specific metrics
    server.tool(
        "sb_backend_instana_service_metrics",
        "Get specific metrics for a service.",
        {
            serviceId: z.string().describe("Service ID"),
            metrics: z.array(z.string()).describe("Metrics to fetch (e.g. calls, latency)"),
        },
        async ({ serviceId, metrics }) => {
            try {
                const metricQuery = metrics.map(m => `metric=${m}`).join('&');
                const path = `/api/application-monitoring/metrics/services/${serviceId}/metrics?${metricQuery}&${getWindow()}`;
                const data = await instanaRequest(path);
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Instana Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Service Traces
    server.tool(
        "sb_backend_instana_service_traces",
        "Get recent traces for a service.",
        {
            serviceId: z.string().describe("Service ID"),
        },
        async ({ serviceId }) => {
            try {
                const path = `/api/application-monitoring/analyze/traces?serviceId=${serviceId}&${getWindow()}`;
                const data = await instanaRequest(path);
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Instana Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Incident List (Alias to get_alerts but maybe filtered)
    server.tool(
        "sb_backend_instana_incident_list",
        "Get list of incidents.",
        {},
        async () => {
            // Reuse get_alerts logic manually or call it if internal
            try {
                const data = await instanaRequest('/api/events?state=OPEN&type=INCIDENT');
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Instana Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Alert Details
    server.tool(
        "sb_backend_instana_alert_details",
        "Get details of a specific alert/event.",
        {
            eventId: z.string().describe("Event/Alert ID"),
        },
        async ({ eventId }) => {
            try {
                const data = await instanaRequest(`/api/events/${eventId}`);
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Instana Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
