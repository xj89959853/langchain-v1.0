import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const calculator = tool(
  ({ operation, a, b }) => {
    switch (operation) {
      case "add":
        return String(a + b);
      case "subtract":
        return String(a - b);
      case "multiply":
        return String(a * b);
      case "divide":
        return b === 0 ? "Division by zero" : String(a / b);
      default:
        return "Unknown operation";
    }
  },
  {
    name: "calculator",
    description: "基本的数学运算",
    schema: z.object({
      operation: z.enum(["add", "subtract", "multiply", "divide"]),
      a: z.number(),
      b: z.number(),
    }),
  }
);

export default calculator;
