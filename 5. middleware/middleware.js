import { createMiddleware } from "langchain";

// 辅助函数：把消息数组转换成简单的一行行文字
function formatMessagesForLog(messages) {
  return messages.map(
    (m, idx) => `${idx + 1}. [${m.constructor.name}] ${String(m.content)}`
  );
}

// 使用 Agent Middleware 正式 API 实现日志中间件（只输出文字内容）
const loggingMiddleware = createMiddleware({
  name: "LoggingMiddleware",

  // 整个 Agent 开始前
  beforeAgent: async (state) => {
    console.log("\n[LOG] === beforeAgent（初始消息）===");
    console.log(formatMessagesForLog(state.messages ?? []));
  },

  // 包一层模型调用
  wrapModelCall: async (request, handler) => {
    console.log("\n[LOG] === wrapModelCall 输入（发给模型的消息）===");
    console.log(formatMessagesForLog(request.messages));

    const response = await handler(request);

    console.log("\n[LOG] === wrapModelCall 输出（模型返回的消息）===");
    // 优先打印模型本身的文本内容
    if (typeof response.content === "string" && response.content.trim()) {
      console.log(response.content);
    } else if (response.tool_calls?.length) {
      // 没有文本，但有工具调用：简单打印工具名和参数
      const summary = response.tool_calls
        .map((call, idx) => {
          return `${idx + 1}. ${call.name}(${JSON.stringify(call.args)})`;
        })
        .join("\n");

      console.log("仅包含工具调用：");
      console.log(summary);
    }

    return response;
  },

  // 包一层工具调用
  wrapToolCall: async (request, handler) => {
    console.log(`\n[LOG] === 准备调用工具：${request.tool.name} ===`);
    console.log("参数：", request.toolCall.args);

    const result = await handler(request);

    console.log(`\n[LOG] === 工具 ${request.tool.name} 返回 ===`);
    console.log(result.content);

    return result;
  },
});

export default loggingMiddleware;
