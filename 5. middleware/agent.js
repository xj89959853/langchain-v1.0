import { createAgent, piiMiddleware } from "langchain";
import { readEmail, sendEmail } from "./tools.js";
import loggingMiddleware from "./middleware.js";

const agent = createAgent({
  model: "gpt-4.1-mini",
  temperature: 0,
  tools: [readEmail, sendEmail],

  // 添加多个内置中间件
  middleware: [
    loggingMiddleware,
    // 自动去除敏感信息
    piiMiddleware("email", { strategy: "redact" }),
    piiMiddleware("url", { strategy: "redact" }),
    // 自定义「手机号」类型：用正则检测 11 位手机号并打码，同时作用于输入、工具结果和模型输出
    piiMiddleware("phone", {
      strategy: "redact",
      detector: "\\b1\\d{10}\\b",
      applyToInput: true,
      applyToToolResults: true,
      applyToOutput: true,
    }),
  ],
});

export default agent;
