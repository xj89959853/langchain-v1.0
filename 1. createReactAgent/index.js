import "dotenv/config";
import readlineSync from "readline-sync";
import { createEcecutor } from "./agent.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// 简单去重：按句子级别去掉重复的句子
function dedupSentences(text) {
  if (!text) return text;
  const parts = text.split(/([。！？!?.\n]+)/);
  const seen = new Set();
  let result = "";

  for (let i = 0; i < parts.length; i += 2) {
    const sentence = (parts[i] || "").trim();
    const punct = parts[i + 1] || "";
    if (!sentence) continue;
    const key = sentence + punct;
    if (seen.has(key)) continue;
    seen.add(key);
    if (result) result += " ";
    result += sentence + punct;
  }

  return result || text;
}

const executor = await createEcecutor();
const chat_history = [];

async function chatLoop() {
  console.log("开始对话，输入内容后回车；/clear 清空历史；/exit 退出。");

  while (true) {
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
      const events = await executor.streamEvents(
        {
          input,
          chat_history,
        },
        {
          version: "v2",
        }
      );

      console.log(""); // 换行

      let finalReply = ""; // 存储最终完整答案（用于写入对话历史）
      let buffer = ""; // 文本缓冲区（用于解析 ReAct 结构）
      let hasShownThought = false; // 是否已显示 Thought 标签
      let hasShownAction = false; // 是否已显示 Action 标签
      let hasShownInput = false; // 是否已显示 Action Input 标签
      let hasShownFinal = false; // 是否已显示 Final Answer 标签

      for await (const ev of events) {
        // 流式 token
        if (ev.event === "on_chat_model_stream") {
          const text = ev.data.chunk.content || ev.data.chunk.text || "";
          if (!text) continue;

          buffer += text;

          // 检测并处理 Thought
          if (!hasShownThought && buffer.includes("Thought:")) {
            const parts = buffer.split("Thought:");
            process.stdout.write("💭 思考：");
            buffer = parts[1] || "";
            hasShownThought = true;
          }

          // 检测并处理 Action
          if (
            hasShownThought &&
            !hasShownAction &&
            buffer.includes("Action:")
          ) {
            const parts = buffer.split("Action:");
            process.stdout.write(parts[0]);
            process.stdout.write("\n🔧 工具：");
            buffer = parts[1] || "";
            hasShownAction = true;
          }

          // 检测并处理 Action Input
          if (
            hasShownAction &&
            !hasShownInput &&
            buffer.includes("Action Input:")
          ) {
            const parts = buffer.split("Action Input:");
            process.stdout.write(parts[0]);
            process.stdout.write("\n📝 参数：");
            buffer = parts[1] || "";
            hasShownInput = true;
          }

          // 检测并处理 Final Answer
          if (!hasShownFinal && buffer.includes("Final Answer:")) {
            const parts = buffer.split("Final Answer:");
            if (hasShownThought) {
              process.stdout.write(parts[0]);
            }
            process.stdout.write("\n\n✅ 答案：");
            buffer = parts[1] || "";
            hasShownFinal = true;
          }

          // 如果在 Final Answer 阶段，直接输出所有内容
          if (hasShownFinal) {
            process.stdout.write(text);
            buffer = "";
          }
        }

        // 工具调用
        if (ev.event === "on_tool_start") {
          // 输出缓冲区剩余内容
          if (buffer.trim()) {
            process.stdout.write(buffer);
            buffer = "";
          }
          process.stdout.write(`\n⚙️  执行中...\n`);
        }

        if (ev.event === "on_tool_end") {
          const result = ev.data?.output;
          process.stdout.write(`📊 结果：${result}\n\n`);
          // 重置状态，准备下一轮
          buffer = "";
          hasShownThought = false;
          hasShownAction = false;
          hasShownInput = false;
        }

        // ========== 获取最终答案（用于历史记录）==========
        if (ev.event === "on_chain_end" && ev.name === "AgentExecutor") {
          const output =
            ev.data?.output?.output ||
            ev.data?.output?.returnValues?.output ||
            ev.data?.output?.returnValues?.text;

          if (output) {
            finalReply = output;
          }
        }
      }

      // 统一输出格式
      // 情况 A：走了 ReAct 流程（包含 Final Answer:）
      // - 已经在上面的流式逻辑中完整输出，这里不再额外打印
      //
      // 情况 B：模型没有输出 Thought / Final Answer（纯聊天回答）
      // - 我们在这里统一包一层「✅ 答案：」
      if (!hasShownFinal) {
        // 优先使用链路结束时返回的 output，其次用缓冲区
        let text = finalReply || buffer.trim();
        if (text) {
          const cleaned = dedupSentences(text);
          process.stdout.write(`✅ 答案：${cleaned}\n`);
          finalReply = cleaned;
        }
      }

      console.log("\n");

      // 写入对话历史
      if (finalReply) {
        chat_history.push(new HumanMessage(input), new AIMessage(finalReply));
      }
    } catch (err) {
      console.error("调用失败：", err?.message || err);
    }
  }
}

chatLoop();
