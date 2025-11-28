import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const calculator = tool(
  async (input) => {
    // 期望 input 是 JSON 字符串，例如：
    // {"operation":"add","a":3,"b":5}
    if (typeof input !== "string") {
      return 'calculator 工具参数错误：需要 JSON 字符串，例如 {"operation":"add","a":3,"b":5}。';
    }

    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch {
      return 'calculator 工具参数错误：JSON 解析失败，请使用例如 {"operation":"add","a":3,"b":5} 的格式。';
    }

    const { operation, a, b } = parsed ?? {};

    if (
      !["add", "subtract", "multiply", "divide"].includes(operation) ||
      typeof a !== "number" ||
      typeof b !== "number"
    ) {
      return 'calculator 工具参数错误：需要形如 {"operation":"add","a":3,"b":5} 的 JSON，其中 a、b 必须是数字。';
    }

    switch (operation) {
      case "add":
        return String(a + b);
      case "subtract":
        return String(a - b);
      case "multiply":
        return String(a * b);
      case "divide":
        return b === 0 ? "除数不能为零" : String(a / b);
      default:
        return "未知的运算类型";
    }
  },
  {
    name: "calculator",
    description:
      '执行基本的数学运算。Action Input 必须是 JSON 字符串，例如 {"operation":"add","a":3,"b":5}。',
    schema: z
      .string()
      .describe(
        'JSON 字符串，例如 {"operation":"add","a":3,"b":5}，operation ∈ add|subtract|multiply|divide。'
      ),
  }
);

export default calculator;
