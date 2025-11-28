// import { pull } from "langchain/hub";
import { ChatOpenAI } from "@langchain/openai";
import tools from "./tools/index.js";
import { createReactAgent, AgentExecutor } from "langchain/agents";
import { customReactPrompt } from "./reactPrompt.js";

export async function createEcecutor() {
  // 1. 提示词
  // const prompt = await pull("hwchase17/react");

  // 2. 模型
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0, // 降低温度以获得更稳定的输出
    streaming: true,
  });

  // 3. 创建 Agent
  const agent = await createReactAgent({
    llm,
    tools,
    prompt: customReactPrompt,
  });

  // 4. 创建执行器并且对外暴露
  return new AgentExecutor({
    agent,
    tools,
    returnIntermediateSteps: false,
    handleParsingErrors: (error) => {
      return `工具调用失败：${error.message}\n请检查参数名和JSON格式，或直接给出 Final Answer。`;
    },
    maxIterations: 3,
    earlyStoppingMethod: "force", // 达到最大迭代时强制停止
  });
}
