import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

export function registerFsTools(server: McpServer) {
    // Read File
    server.tool(
        "sb_backend_fs_read_file",
        "Read the contents of a file.",
        {
            filePath: z.string().describe("Absolute path to the file"),
        },
        async ({ filePath }) => {
            try {
                const content = await fs.readFile(filePath, "utf-8");
                return {
                    content: [{ type: "text", text: content }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error reading file: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Write File
    server.tool(
        "sb_backend_fs_write_file",
        "Write content to a file (overwrites existing).",
        {
            filePath: z.string().describe("Absolute path to the file"),
            content: z.string().describe("Content to write"),
        },
        async ({ filePath, content }) => {
            try {
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content, "utf-8");
                return {
                    content: [{ type: "text", text: `Successfully wrote to ${filePath}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error writing file: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // List Directory
    server.tool(
        "sb_backend_fs_list_directory",
        "List contents of a directory.",
        {
            dirPath: z.string().describe("Absolute path to the directory"),
        },
        async ({ dirPath }) => {
            try {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                const list = entries.map(e => `${e.isDirectory() ? '[DIR]' : '[FILE]'} ${e.name}`).join("\n");
                return {
                    content: [{ type: "text", text: list || "Empty directory." }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error listing directory: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Create File (Empty)
    server.tool(
        "sb_backend_fs_create_file",
        "Create a new empty file.",
        {
            filePath: z.string().describe("Absolute path to the file"),
        },
        async ({ filePath }) => {
            try {
                await fs.writeFile(filePath, "", "utf-8");
                return {
                    content: [{ type: "text", text: `Created file ${filePath}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error creating file: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Delete File
    server.tool(
        "sb_backend_fs_delete_file",
        "Delete a file.",
        {
            filePath: z.string().describe("Absolute path to the file"),
        },
        async ({ filePath }) => {
            try {
                await fs.unlink(filePath);
                return {
                    content: [{ type: "text", text: `Deleted file ${filePath}` }],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error deleting file: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
