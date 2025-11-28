import { z } from "zod";
import { tool } from "@langchain/core/tools";

export function getCurrentWeather({ location, unit = "celsius" }) {
  const weather_info = {
    location,
    temperature: "22",
    unit,
    forecast: ["晴朗 ☀️", "微风 🌬️"],
  };
  return JSON.stringify(weather_info);
}

export const weatherTool = tool((args) => getCurrentWeather(args), {
  name: "get_current_weather",
  description:
    "查询指定城市当前天气。返回 JSON 字符串，包含温度、单位与简短描述。",
  schema: z.object({
    location: z.string().min(1).describe("城市名称，例如：北京、上海"),
    unit: z
      .enum(["celsius", "fahrenheit"])
      .default("celsius")
      .describe("温度单位"),
  }),
});

export default weatherTool;
