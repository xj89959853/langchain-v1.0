import { tool } from "@langchain/core/tools";
import { z } from "zod";

export function getCurrentWeather(location, unit = "celsius") {
  const weather_info = {
    location,
    temperature: "22",
    unit,
    forecast: ["晴朗 ☀️", "微风 🌬️"],
  };
  return JSON.stringify(weather_info);
}

// 这里特别注意：ReAct Agent 会把 Action Input 当作「字符串」传给工具
// 所以 schema 使用 z.string()，在内部自己解析 JSON / 文本，而不是直接用对象 schema
export const weatherTool = tool(
  async (input) => {
    // input 可能是：
    // 1) 纯城市名：   "成都"
    // 2) JSON 字符串： "{\"location\":\"成都\"}"
    if (typeof input !== "string") {
      return '天气工具参数错误：需要城市名称字符串，或形如 {"location":"成都"} 的 JSON 字符串。';
    }

    let location = input.trim();

    // 如果看起来像 JSON，就尝试解析
    if (location.startsWith("{")) {
      try {
        const parsed = JSON.parse(location);
        location =
          parsed.location || parsed.city || parsed.loc || parsed.place || "";
      } catch {
        return '天气工具参数错误：JSON 解析失败，请使用例如 {"location":"成都"} 的格式。';
      }
    }

    if (!location || typeof location !== "string") {
      return "天气工具参数错误：缺少 location 字段，请提供城市名称。";
    }

    return getCurrentWeather(location);
  },
  {
    name: "get_current_weather",
    description:
      '查询指定城市当前天气。输入可以是城市名称字符串（如："成都"），也可以是 JSON 字符串（如：\'{"location":"成都"}\'）。',
    schema: z
      .string()
      .describe(
        '城市名称字符串，或 JSON 字符串。例如："成都" 或 \'{"location":"成都"}\'。'
      ),
  }
);

export default weatherTool;
