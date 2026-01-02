import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";

/**
 * Register Jira related tools.
 *
 * Required environment variables (add to .env):
 *   JIRA_URL – base URL of your Jira instance (e.g. https://myorg.atlassian.net)
 *   JIRA_USER – email address of the service account / user
 *   JIRA_API_TOKEN – personal API token (Basic auth password)
 */
export function registerJiraTools(server: McpServer) {
    const JIRA_URL = process.env.JIRA_URL?.replace(/\/+$/, "");
    const JIRA_USER = process.env.JIRA_USER;
    const JIRA_TOKEN = process.env.JIRA_API_TOKEN;

    if (!JIRA_URL || !JIRA_USER || !JIRA_TOKEN) {
        console.warn(
            "Jira environment variables missing – Jira tools will not be registered."
        );
        return;
    }

    const jiraAxios = axios.create({
        baseURL: `${JIRA_URL}/rest/api/3`,
        auth: { username: JIRA_USER, password: JIRA_TOKEN },
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
    });

    // -----------------------------------------------------------------
    // Create Issue
    // -----------------------------------------------------------------
    server.tool(
        "sb_backend_jira_create_issue",
        "Create a new Jira issue (ticket).",
        {
            projectKey: z.string().describe("Jira project key (e.g. PROJ)"),
            summary: z.string().describe("Short summary of the issue"),
            description: z.string().optional().describe("Long description (optional)"),
            issueType: z.string().default("Task").describe("Issue type (Task, Bug, …)"),
        },
        async ({ projectKey, summary, description, issueType }) => {
            try {
                const payload = {
                    fields: {
                        project: { key: projectKey },
                        summary,
                        description,
                        issuetype: { name: issueType },
                    },
                };
                const { data } = await jiraAxios.post("/issue", payload);
                return {
                    content: [{ type: "text", text: `✅ Issue created: ${data.key}` }],
                };
            } catch (e: any) {
                return {
                    content: [{ type: "text", text: `❌ Jira error: ${e.message}` }],
                    isError: true,
                };
            }
        }
    );

    // -----------------------------------------------------------------
    // Update Issue (generic fields)
    // -----------------------------------------------------------------
    server.tool(
        "sb_backend_jira_update_issue",
        "Update fields of an existing Jira issue.",
        {
            issueKey: z.string().describe("Issue key, e.g. PROJ-123"),
            fields: z.record(z.string(), z.any()).describe("Object with fields to update (Jira field names as keys)"),
        },
        async ({ issueKey, fields }) => {
            try {
                await jiraAxios.put(`/issue/${issueKey}`, { fields });
                return {
                    content: [{ type: "text", text: `✅ Issue ${issueKey} updated` }],
                };
            } catch (e: any) {
                return {
                    content: [{ type: "text", text: `❌ Jira error: ${e.message}` }],
                    isError: true,
                };
            }
        }
    );

    // -----------------------------------------------------------------
    // Transition Issue (change status)
    // -----------------------------------------------------------------
    server.tool(
        "sb_backend_jira_transition_issue",
        "Transition an issue to a new status (workflow).",
        {
            issueKey: z.string().describe("Issue key, e.g. PROJ-123"),
            transitionId: z.string().describe("Transition ID – obtain via jira_get_transitions or UI"),
        },
        async ({ issueKey, transitionId }) => {
            try {
                await jiraAxios.post(`/issue/${issueKey}/transitions`, {
                    transition: { id: transitionId },
                });
                return {
                    content: [{ type: "text", text: `✅ Issue ${issueKey} transitioned (id=${transitionId})` }],
                };
            } catch (e: any) {
                return {
                    content: [{ type: "text", text: `❌ Jira error: ${e.message}` }],
                    isError: true,
                };
            }
        }
    );

    // -----------------------------------------------------------------
    // Assign Issue
    // -----------------------------------------------------------------
    server.tool(
        "sb_backend_jira_assign_issue",
        "Assign an issue to a user.",
        {
            issueKey: z.string().describe("Issue key, e.g. PROJ-123"),
            assigneeAccountId: z.string().describe("Atlassian accountId of the assignee"),
        },
        async ({ issueKey, assigneeAccountId }) => {
            try {
                await jiraAxios.put(`/issue/${issueKey}/assignee`, {
                    accountId: assigneeAccountId,
                });
                return {
                    content: [{ type: "text", text: `✅ Issue ${issueKey} assigned` }],
                };
            } catch (e: any) {
                return {
                    content: [{ type: "text", text: `❌ Jira error: ${e.message}` }],
                    isError: true,
                };
            }
        }
    );

    // -----------------------------------------------------------------
    // Add Comment
    // -----------------------------------------------------------------
    server.tool(
        "sb_backend_jira_comment_issue",
        "Add a comment to a Jira issue.",
        {
            issueKey: z.string().describe("Issue key, e.g. PROJ-123"),
            comment: z.string().describe("Comment body (plain text or markdown)"),
        },
        async ({ issueKey, comment }) => {
            try {
                await jiraAxios.post(`/issue/${issueKey}/comment`, { body: comment });
                return {
                    content: [{ type: "text", text: `✅ Comment added to ${issueKey}` }],
                };
            } catch (e: any) {
                return {
                    content: [{ type: "text", text: `❌ Jira error: ${e.message}` }],
                    isError: true,
                };
            }
        }
    );
    // -----------------------------------------------------------------
    // List/Search Issues (JQL)
    // -----------------------------------------------------------------
    server.tool(
        "sb_backend_jira_list_issues",
        "List issues using JQL (Jira Query Language).",
        {
            jql: z.string().describe("JQL query string (e.g. 'project = SB AND status = Backlog')"),
            maxResults: z.number().optional().default(20).describe("Max number of results to return"),
            fields: z.array(z.string()).optional().default(["summary", "status", "assignee", "priority"]).describe("List of fields to include"),
        },
        async ({ jql, maxResults, fields }) => {
            try {
                const { data } = await jiraAxios.get("/search", {
                    params: {
                        jql,
                        maxResults,
                        fields: fields.join(","),
                        validateQuery: "strict",
                    },
                });

                const formattedIssues = data.issues.map((issue: any) => ({
                    key: issue.key,
                    summary: issue.fields.summary,
                    status: issue.fields.status?.name,
                    assignee: issue.fields.assignee ? `${issue.fields.assignee.displayName} (${issue.fields.assignee.accountId})` : "Unassigned",
                    priority: issue.fields.priority?.name,
                    link: `${JIRA_URL}/browse/${issue.key}`
                }));

                return {
                    content: [{ type: "text", text: JSON.stringify(formattedIssues, null, 2) }],
                };
            } catch (e: any) {
                const errorMsg = e.response?.data?.errorMessages?.join(", ") || e.message;
                return {
                    content: [{ type: "text", text: `❌ Jira error: ${errorMsg}` }],
                    isError: true,
                };
            }
        }
    );
}
