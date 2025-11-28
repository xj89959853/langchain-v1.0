import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import tools from "./tools/index.js";

const model = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
});

const agent = createAgent({
  model,
  tools,
  systemPrompt: "你是一个聪明的AI智能机器人",
});

export default agent;
