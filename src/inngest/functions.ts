import { Sandbox } from "@e2b/code-interpreter";

import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
} from "@inngest/agent-kit";

import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-nextjs-jk-proj");
      return sandbox.sandboxId;
    });
    // Create a new agent with a system prompt (you can add optional tools, too)
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "Expert Code Agent for Next.js",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1,
        },
      }),

      //our agent now ability to use terminal uses sandbox api and keep result either command execution or error
      // we can use this to run commands in the sandbox environment
      tools: [
        createTool({
          name: "terminal",
          description: "execute terminal for commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (error) {
                console.error(
                  `Command execution failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`
                );

                // Return a formatted error message
                // This will be returned to the agent and can be used in the response
                // AI agents can handle this error gracefully
                // and provide feedback to the user
                // legasis package
                // inggest will handle this error and run again

                return `Command execution failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createorupdate-file",
          description: "create or update a file in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            //in short when we receive files from the agent we will create or update them in the sandbox
            // and return the updated files to the agent
            // this will allow the agent to keep track of the files and their content with structured data and format like this
            /** 
               * {
               *"app.tsx": "<p>app page</p>",
               *"button.tsx": "<p>button component</p>",
               *"page.tsx": "<p>page page</p>" 

               * 
              */

            const newFiles = await step?.run(
              "create-or-update-files",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }
                  return updatedFiles;
                } catch (error) {
                  console.error(`File creation failed: ${error}`);
                  return `File creation failed: ${error}`;
                }
              }
            );

            // so output will be like object with files and their content or error message and if output is object then we will update the network state with new files
            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        //below tool will read files from the sandbox and return their content
        // this will allow the agent to read files and their content in the sandbox
        //this is only for reading files from the sandbox and for AI agent not for user to read files
        createTool({
          name: "readFile",
          description: "read a file from the sandbox",
          parameters: z.object({
            files: z.array(z.string()), // array of file paths to read
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFile", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                console.error(`File read failed: ${error}`);
                return `File read failed: ${error}`;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "code-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    // FIX: Add proper error handling and fallback for undefined input
    console.log("Full event object:", JSON.stringify(event, null, 2));
    console.log("Event data:", event.data);
    console.log("Event data type:", typeof event.data);

    let input;

    // More robust input extraction
    if (event.data) {
      if (typeof event.data === "string") {
        input = event.data;
      } else if (event.data.value) {
        input = event.data.value;
      } else if (event.data.input) {
        input = event.data.input;
      } else if (event.data.message) {
        input = event.data.message;
      } else {
        // If event.data is an object but doesn't have expected keys
        input = JSON.stringify(event.data);
      }
    }

    // Final fallback
    if (!input || (typeof input !== "string" && !Array.isArray(input))) {
      input = "Create a simple Next.js application";
    }

    console.log("Final input:", input);
    console.log("Input type:", typeof input);
    console.log("Input length:", input?.length);

    // Ensure input is a string for the network
    const processedInput =
      typeof input === "string" ? input : JSON.stringify(input);

    console.log("Running network with processed input:", processedInput);

    let result;

    try {
      result = await network.run(processedInput);
    } catch (error) {
      console.error("Network run error:", error);
      console.error("Error stack:", error.stack);
      console.log("Retrying with simple fallback input...");
      result = await network.run(event.data.value);
    }

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: "Error: Unable to generate a valid summary or files.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
      return await prisma.message.create({
        data: {
          content: result.state.data.summary || "No summary provided",
          role: "ASSISTANT",
          type: "RESULT",
          fragments: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files || {},
            },
          },
        },
      });
    });
    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
