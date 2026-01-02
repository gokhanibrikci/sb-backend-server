import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as k8s from "@kubernetes/client-node";

export function registerK8sTools(server: McpServer) {
    // Initialize K8s client
    const kc = new k8s.KubeConfig();
    try {
        kc.loadFromDefault();
    } catch (e) {
        console.error("Failed to load KubeConfig:", e);
    }

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

    server.tool(
        "sb_backend_k8s_list_pods",
        "List pods in a specific namespace.",
        {
            namespace: z.string().default("default").describe("Kubernetes namespace"),
        },
        async ({ namespace = "default" }) => {
            try {
                // Using object signature for newer K8s clients (if 1.0+)
                // or just fixing the call if the generated code changed.
                // The error says expects CoreV1ApiListNamespacedPodRequest
                const res = await k8sApi.listNamespacedPod({ namespace });

                // The error 'Property body does not exist on type V1PodList' implies res IS the list
                // So we use res.items directly.
                const items = res.items || [];

                const pods = items.map((pod: any) => {
                    const status = pod.status?.phase;
                    const restartCount = pod.status?.containerStatuses?.[0]?.restartCount || 0;
                    return `Pod: ${pod.metadata?.name} | Status: ${status} | Restarts: ${restartCount}`;
                }).join("\n");

                return {
                    content: [{ type: "text", text: pods || "No pods found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `K8s Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    server.tool(
        "sb_backend_k8s_get_logs",
        "Get logs from a specific pod.",
        {
            namespace: z.string().default("default"),
            podName: z.string(),
            tailLines: z.number().optional().default(50),
        },
        async ({ namespace = "default", podName, tailLines }) => {
            try {
                // Expects CoreV1ApiReadNamespacedPodLogRequest
                const res = await k8sApi.readNamespacedPodLog({
                    name: podName,
                    namespace,
                    tailLines // Adding tailLines support since we have it
                });

                // For logs, it usually returns string.
                const logContent = String(res);

                return {
                    content: [{ type: "text", text: logContent || "" }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `K8s Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // List Namespaces
    server.tool(
        "sb_backend_k8s_list_namespaces",
        "List all namespaces.",
        {},
        async () => {
            try {
                const res = await k8sApi.listNamespace();
                const items = res.items || [];
                const list = items.map(ns => ns.metadata?.name).join("\n");
                return {
                    content: [{ type: "text", text: list || "No namespaces found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `K8s Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Describe Pod (Simplified)
    server.tool(
        "sb_backend_k8s_describe_pod",
        "Get details of a specific pod.",
        {
            namespace: z.string().default("default"),
            podName: z.string(),
        },
        async ({ namespace = "default", podName }) => {
            try {
                const res = await k8sApi.readNamespacedPod({
                    name: podName,
                    namespace
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `K8s Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Get Deployments
    server.tool(
        "sb_backend_k8s_get_deployments",
        "List deployments in a namespace.",
        {
            namespace: z.string().default("default"),
        },
        async ({ namespace = "default" }) => {
            try {
                const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
                const res = await k8sAppsApi.listNamespacedDeployment({ namespace });
                const items = res.items || [];
                const list = items.map(d => `Name: ${d.metadata?.name} | Replicas: ${d.status?.replicas}/${d.spec?.replicas}`).join("\n");
                return {
                    content: [{ type: "text", text: list || "No deployments found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `K8s Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Get Services
    server.tool(
        "sb_backend_k8s_get_services",
        "List services in a namespace.",
        {
            namespace: z.string().default("default"),
        },
        async ({ namespace = "default" }) => {
            try {
                const res = await k8sApi.listNamespacedService({ namespace });
                const items = res.items || [];
                const list = items.map(s => `Name: ${s.metadata?.name} | Type: ${s.spec?.type} | ClusterIP: ${s.spec?.clusterIP}`).join("\n");
                return {
                    content: [{ type: "text", text: list || "No services found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `K8s Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Get ConfigMaps
    server.tool(
        "sb_backend_k8s_get_configmaps",
        "List ConfigMaps in a namespace.",
        {
            namespace: z.string().default("default"),
        },
        async ({ namespace = "default" }) => {
            try {
                const res = await k8sApi.listNamespacedConfigMap({ namespace });
                const items = res.items || [];
                const list = items.map(cm => `Name: ${cm.metadata?.name} | Keys: ${Object.keys(cm.data || {}).join(", ")}`).join("\n");
                return {
                    content: [{ type: "text", text: list || "No ConfigMaps found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `K8s Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Get Secrets Metadata (No Values)
    server.tool(
        "sb_backend_k8s_get_secrets_metadata",
        "List Secrets in a namespace (Metadata only).",
        {
            namespace: z.string().default("default"),
        },
        async ({ namespace = "default" }) => {
            try {
                const res = await k8sApi.listNamespacedSecret({ namespace });
                const items = res.items || [];
                const list = items.map(s => `Name: ${s.metadata?.name} | Type: ${s.type}`).join("\n");
                return {
                    content: [{ type: "text", text: list || "No secrets found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `K8s Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
