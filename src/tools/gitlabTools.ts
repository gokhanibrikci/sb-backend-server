import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";

export function registerGitlabTools(server: McpServer) {
    const GITLAB_URL = process.env.GITLAB_URL || "https://gitlab.com";
    const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

    // Helper for requests
    async function gitlabRequest(path: string) {
        if (!GITLAB_TOKEN) {
            throw new Error("GITLAB_TOKEN environment variable is not set.");
        }
        const response = await axios.get(`${GITLAB_URL}/api/v4${path}`, {
            headers: { "PRIVATE-TOKEN": GITLAB_TOKEN },
        });
        return response.data;
    }

    server.tool(
        "sb_backend_gitlab_list_pipelines",
        "List the latest pipelines for a project.",
        {
            projectId: z.string().describe("The ID or URL-encoded path of the project"),
            count: z.number().optional().describe("Number of pipelines to fetch (default 5)"),
        },
        async ({ projectId, count = 5 }) => {
            try {
                const pipelines = await gitlabRequest(
                    `/projects/${encodeURIComponent(projectId)}/pipelines?per_page=${count}`
                );

                const summary = pipelines.map((p: any) =>
                    `ID: ${p.id} | Status: ${p.status} | Ref: ${p.ref} | URL: ${p.web_url}`
                ).join("\n");

                return {
                    content: [{ type: "text", text: summary || "No pipelines found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `GitLab Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    server.tool(
        "sb_backend_gitlab_get_job_failure",
        "Get failure logs from the failed jobs of a specific pipeline.",
        {
            projectId: z.string().describe("The ID or URL-encoded path of the project"),
            pipelineId: z.number().describe("The pipeline ID"),
        },
        async ({ projectId, pipelineId }) => {
            try {
                // 1. Get jobs for the pipeline
                const jobs = await gitlabRequest(
                    `/projects/${encodeURIComponent(projectId)}/pipelines/${pipelineId}/jobs`
                );

                // 2. Filter failed jobs
                const failedJobs = jobs.filter((j: any) => j.status === 'failed');

                if (failedJobs.length === 0) {
                    return {
                        content: [{ type: "text", text: "No failed jobs found in this pipeline." }],
                    };
                }

                let report = `Found ${failedJobs.length} failed jobs:\n`;

                // 3. Get trace (log) for each failed job (limit to first 2 to avoid huge output)
                for (const job of failedJobs.slice(0, 2)) {
                    report += `\n--- Job: ${job.name} (ID: ${job.id}) ---\n`;
                    try {
                        const trace = await gitlabRequest(
                            `/projects/${encodeURIComponent(projectId)}/jobs/${job.id}/trace`
                        );
                        // Take last 20 lines of log
                        const lines = trace.split('\n');
                        const lastLines = lines.slice(-20).join('\n');
                        report += `Log tail:\n${lastLines}\n`;
                    } catch (e: any) {
                        report += `Could not fetch log: ${e.message}\n`;
                    }
                }

                return {
                    content: [{ type: "text", text: report }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `GitLab Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    server.tool(
        "sb_backend_gitlab_list_commits",
        "List the latest commits for a project.",
        {
            projectId: z.string().describe("The ID or URL-encoded path of the project"),
            count: z.number().optional().describe("Number of commits to fetch (default 5)"),
            ref: z.string().optional().describe("Branch or tag name (optional)"),
        },
        async ({ projectId, count = 5, ref }) => {
            try {
                let url = `/projects/${encodeURIComponent(projectId)}/repository/commits?per_page=${count}`;
                if (ref) {
                    url += `&ref_name=${encodeURIComponent(ref)}`;
                }
                const commits = await gitlabRequest(url);

                const summary = commits.map((c: any) =>
                    `Hash: ${c.short_id} | Author: ${c.author_name} | Date: ${c.created_at} | Message: ${c.title}`
                ).join("\n");

                return {
                    content: [{ type: "text", text: summary || "No commits found." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `GitLab Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );


    server.tool(
        "sb_backend_gitlab_create_merge_request",
        "Create a new merge request.",
        {
            projectId: z.string().describe("The ID or URL-encoded path of the project"),
            sourceBranch: z.string().describe("The source branch name"),
            targetBranch: z.string().describe("The target branch name (usually main or master)"),
            title: z.string().describe("Title of the merge request"),
            description: z.string().optional().describe("Description of the merge request"),
        },
        async ({ projectId, sourceBranch, targetBranch, title, description }) => {
            try {
                const response = await axios.post(
                    `${GITLAB_URL}/api/v4/projects/${encodeURIComponent(projectId)}/merge_requests`,
                    {
                        source_branch: sourceBranch,
                        target_branch: targetBranch,
                        title: title,
                        description: description,
                    },
                    {
                        headers: { "PRIVATE-TOKEN": GITLAB_TOKEN },
                    }
                );

                const mr = response.data;
                return {
                    content: [
                        {
                            type: "text",
                            text: `Merge Request Created Successfully!\nURL: ${mr.web_url}\nID: ${mr.iid}\nState: ${mr.state}`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `GitLab Error: ${error.response?.data?.message || error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Open Issue
    server.tool(
        "sb_backend_gitlab_open_issue",
        "Open a new issue in GitLab.",
        {
            projectId: z.string().describe("The ID or URL-encoded path of the project"),
            title: z.string().describe("Title of the issue"),
            description: z.string().optional().describe("Description of the issue"),
            labels: z.array(z.string()).optional().describe("Labels"),
        },
        async ({ projectId, title, description, labels }) => {
            try {
                const response = await axios.post(
                    `${GITLAB_URL}/api/v4/projects/${encodeURIComponent(projectId)}/issues`,
                    {
                        title,
                        description,
                        labels: labels ? labels.join(',') : undefined
                    },
                    {
                        headers: { "PRIVATE-TOKEN": GITLAB_TOKEN },
                    }
                );
                const issue = response.data;
                return {
                    content: [{ type: "text", text: `Issue Created: #${issue.iid} - ${issue.title}\nURL: ${issue.web_url}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `GitLab Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Review Merge Request (Get details/diffs)
    server.tool(
        "sb_backend_gitlab_review_merge_request",
        "Get details and changes of a Merge Request.",
        {
            projectId: z.string().describe("Project ID"),
            mrIid: z.number().describe("Merge Request IID"),
        },
        async ({ projectId, mrIid }) => {
            try {
                const details = await gitlabRequest(`/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}`);
                const changes = await gitlabRequest(`/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/changes`);

                let report = `MR !${mrIid}: ${details.title}\nState: ${details.state}\nAuthor: ${details.author.name}\n\nDescription:\n${details.description}\n\nChanges:\n`;

                const changedFiles = changes.changes || [];
                report += changedFiles.map((c: any) => `- ${c.new_path} (${c.diff.length} bytes diff)`).join('\n');

                return {
                    content: [{ type: "text", text: report }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `GitLab Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Pipeline Status
    server.tool(
        "sb_backend_gitlab_pipeline_status",
        "Get the status of a specific pipeline.",
        {
            projectId: z.string().describe("Project ID"),
            pipelineId: z.number().describe("Pipeline ID"),
        },
        async ({ projectId, pipelineId }) => {
            try {
                const p = await gitlabRequest(`/projects/${encodeURIComponent(projectId)}/pipelines/${pipelineId}`);
                return {
                    content: [{ type: "text", text: `Pipeline #${p.id}\nStatus: ${p.status}\nRef: ${p.ref}\nURL: ${p.web_url}\nDetail: ${JSON.stringify(p, null, 2)}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `GitLab Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
