import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import pg from "pg";

export function registerDbTools(server: McpServer) {
    const dbUrl = process.env.DATABASE_URL;

    // Helper for DB query
    async function runQuery(query: string, params: any[] = []) {
        if (!dbUrl) throw new Error("DATABASE_URL is not set");
        const client = new pg.Client({ connectionString: dbUrl });
        try {
            await client.connect();
            const res = await client.query(query, params);
            return res;
        } finally {
            try { await client.end(); } catch { }
        }
    }

    // Select Query (Renamed from dev_db_query)
    server.tool(
        "sb_backend_db_select_query",
        "Execute a READ-ONLY SQL query.",
        {
            query: z.string().describe("The SQL query (SELECT only)"),
        },
        async ({ query }) => {
            if (!query.trim().toLowerCase().startsWith("select") && !query.trim().toLowerCase().startsWith("explain")) {
                return {
                    content: [{ type: "text", text: "Error: Only SELECT or EXPLAIN queries are allowed." }],
                    isError: true,
                };
            }
            try {
                const res = await runQuery(query);
                return {
                    content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `DB Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Describe Schema
    server.tool(
        "sb_backend_db_describe_schema",
        "Get schema information for tables.",
        {
            schema: z.string().optional().default("public").describe("Schema name"),
        },
        async ({ schema }) => {
            const query = `
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = $1
                ORDER BY table_name, ordinal_position;
            `;
            try {
                const res = await runQuery(query, [schema]);
                return {
                    content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error describing schema: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // List Indexes
    server.tool(
        "sb_backend_db_list_indexes",
        "List indexes for a specific table or all tables.",
        {
            tableName: z.string().optional().describe("Table name to filter by"),
        },
        async ({ tableName }) => {
            let query = `
                SELECT
                    tablename,
                    indexname,
                    indexdef
                FROM
                    pg_indexes
                WHERE
                    schemaname = 'public'
            `;
            const params = [];
            if (tableName) {
                query += ` AND tablename = $1`;
                params.push(tableName);
            }

            try {
                const res = await runQuery(query, params);
                return {
                    content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error listing indexes: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Explain Query
    server.tool(
        "sb_backend_db_explain_query",
        "Explain the execution plan of a query.",
        {
            query: z.string().describe("The SQL query to explain"),
        },
        async ({ query }) => {
            try {
                const explainQuery = `EXPLAIN ${query}`;
                const res = await runQuery(explainQuery);
                // Result of EXPLAIN is usually a set of lines
                const plan = res.rows.map((r: any) => r['QUERY PLAN']).join('\n');
                return {
                    content: [{ type: "text", text: `Query Plan:\n${plan}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error explaining query: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );


}
