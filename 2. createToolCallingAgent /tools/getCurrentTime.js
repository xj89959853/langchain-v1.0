import { z } from "zod";
import { tool } from "@langchain/core/tools";

export function getCurrentTime({ format = "locale" }) {
  switch (format) {
    case "iso":
      return new Date().toISOString();
    case "locale":
      return new Date().toLocaleString();
    case "string":
      return new Date().toString();
    default:
      return "不支持的 format 类型，请传入 iso / locale / string";
  }
}

export const timeTool = tool((args) => getCurrentTime(args), {
  name: "get_current_time",
  description: "获取当前时间，可选输出格式：iso / locale / string。",
  schema: z.object({
    format: z
      .enum(["iso", "locale", "string"])
      .default("locale")
      .describe("时间格式"),
  }),
});

export default timeTool;
