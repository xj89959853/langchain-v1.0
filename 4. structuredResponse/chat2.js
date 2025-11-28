// 更加友好的输出结构化信息
import "dotenv/config";
import readlineSync from "readline-sync";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
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

const chat_history = []; // 存储会话记录

async function main() {
  console.log("开始对话，输入内容后回车；/clear 清空历史；/exit 退出。");
  while (true) {
    // 获取用户的输入
    const input = readlineSync.question("用户：").trim();

    if (!input) continue;

    if (input === "/exit") {
      console.log("已退出");
      break;
    }

    if (input === "/clear") {
      chat_history.length = 0;
      console.log("已清空历史");
      continue;
    }

    try {
      // 和 agent 进行交互
      const messages = [...chat_history, new HumanMessage(input)];

      const events = await agent.streamEvents(
        {
          messages,
        },
        {
          version: "v2",
        }
      );

      process.stdout.write("助理：");

      let jsonText = ""; // 累积结构化 JSON 文本
      let streamedAnswer = ""; // 已经输出给用户的 answer 文本

      for await (const ev of events) {
        if (ev.event === "on_chat_model_stream") {
          const text = ev.data.chunk.text ?? "";
          if (!text) continue;

          // 累积原始 JSON 文本
          jsonText += text;

          // 尝试从当前累积文本中提取 answer 字段的当前内容，并按增量流式输出
          const match = jsonText.match(/"answer"\s*:\s*"([^"]*)/);
          if (match) {
            const currentAnswer = match[1]?.replace(/\\n/g, "\n") ?? "";
            // 只把比上一次多出来的部分打印出来，实现“答案”字段的流式展示
            const diff = currentAnswer.slice(streamedAnswer.length);
            if (diff) {
              process.stdout.write(diff);
              streamedAnswer = currentAnswer;
            }
          }
        }

        if (ev.event === "on_tool_start") {
          process.stdout.write(`\n【正在调用工具 ${ev.name}】\n`);
        }
        if (ev.event === "on_tool_end") {
          process.stdout.write(`\n【调用工具 ${ev.name} 完成】\n`);
        }
      }

      // 事件结束后再解析完整的结构化结果，补充“信心”和“分类”信息
      let formatted;
      try {
        const parsed = Schema.parse(JSON.parse(jsonText));
        formatted = `答案：${parsed.answer}，我对这个答案的信息为${parsed.confidence}，这个问题属于${parsed.classification}分类`;

        // 在已经流式输出过的 answer 后面，补充信心和分类两部分
        const tail = `，我对这个答案的信息为${parsed.confidence}，这个问题属于${parsed.classification}分类`;
        process.stdout.write(tail + "\n\n");
      } catch {
        // 如果解析失败，就退化为把原始 JSON 打印出来，避免对话中断
        formatted = streamedAnswer || jsonText;
        process.stdout.write("\n");
      }

      // 将当前会话写入历史，使用整理好的自然语言结果
      chat_history.push(new HumanMessage(input), new AIMessage(formatted));
    } catch (err) {
      console.error("调用失败：", err?.message ?? err);
    }
  }
}
main();
