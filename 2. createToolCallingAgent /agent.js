import { pull } from "langchain/hub";
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import tools from "./tools/index.js";

// 创建整个 agent 的核心逻辑，包括 executor
export async function createEcecutor() {
  // 1. 提示词
  const prompt = await pull("hwchase17/openai-tools-agent");

  // 2. 模型
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.5,
    streaming: true,
  });

  // 3. 创建 agent
  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
  });
}
