import "dotenv/config";
import agent from "./agent.js";

async function main() {
  console.log("启动智能邮件...");

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          "我的邮箱是 test@example.com，帮我查看最近的邮件，如果有人发了手机号，就回复对方我会尽快联系他。",
      },
    ],
  });

  const finalMessage = result.messages[result.messages.length - 1];
  console.log("\n最终输出结果：");
  console.log(finalMessage?.content ?? finalMessage);
}

main();
