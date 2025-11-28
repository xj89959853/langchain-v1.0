import "dotenv/config";
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";

const Schema = z.object({
  answer: z.string(),
  confidence: z.number(),
  classification: z.string(),
});

const model = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
});

const agent = createAgent({
  model,
  systemPrompt: "你是一个聪明的AI智能机器人",
  responseFormat: Schema,
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "JS中的闭包是什么？" }],
});

console.log(result.structuredResponse);
