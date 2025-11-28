import { tool } from "@langchain/core/tools";
import { z } from "zod";

export function getCurrentTime(format = "locale") {
  switch (format) {
    case "iso":
      return new Date().toISOString();
    case "locale":
      return new Date().toLocaleString();
    case "string":
      return new Date().toString();
    default:
      return new Date().toLocaleString();
  }
}

export const timeTool = tool(
  async (input) => {
    // input 可能是 ""、"iso"、"locale"、"string" 或 JSON 字符串
    if (!input || typeof input !== "string") {
      return getCurrentTime("locale");
    }

    let format = input.trim();

    if (format.startsWith("{")) {
      try {
        const parsed = JSON.parse(format);
        if (parsed && typeof parsed.format === "string") {
          format = parsed.format;
        }
      } catch {
        // 解析失败就忽略，按默认处理
        format = "locale";
      }
    }

    if (!["iso", "locale", "string"].includes(format)) {
      format = "locale";
    }

    return getCurrentTime(format);
  },
  {
    name: "get_current_time",
    description:
      '获取当前时间。Action Input 可以为空字符串，也可以是 "iso" / "locale" / "string"，或 JSON 字符串，如 \'{"format":"iso"}\'。',
    schema: z
      .string()
      .describe(
        '时间格式字符串（iso | locale | string），或 JSON 字符串。例如："iso" 或 \'{"format":"iso"}\'。'
      ),
  }
);

export default timeTool;
