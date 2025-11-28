import "dotenv/config";
import readlineSync from "readline-sync";
import { createEcecutor } from "./agent.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const executor = await createEcecutor(); // 创建一个执行器，后期都是和执行器进行交互
const chat_history = []; // 存储会话记录

async function chatLoop() {
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
      chat_history.length = [];
      console.log("已清空历史");
      continue;
    }

    try {
      // 和 agent 进行交互
      const events = await executor.streamEvents(
        {
          input,
          chat_history,
        },
        {
          version: "v2",
        }
      );

      process.stdout.write("助理：");
      let finalText = ""; // 拼接最终完整的回复

      for await (const ev of events) {
        if (ev.event === "on_chat_model_stream") {
          const text = ev.data.chunk.text; // 拿到此次 token 得到的文本值
          finalText += text;
          process.stdout.write(text);
        }

        if (ev.event === "on_tool_start") {
          process.stdout.write(`\n【正在调用工具 ${ev.name}】\n`);
        }
        if (ev.event === "on_tool_end") {
          process.stdout.write(`\n【调用工具 ${ev.name} 完成】\n`);
        }
      }

      console.log("\n");

      // 将当前会话写入历史
      chat_history.push(new HumanMessage(input), new AIMessage(finalText));
    } catch (err) {
      console.error("调用失败：", err?.message ?? err);
    }
  }
}
chatLoop();
