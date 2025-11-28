import { tool } from "langchain";
import { z } from "zod/v4";


export const readEmail = tool(
  async ({ subject }) => {
    console.log(`[Tool] 正在读取邮件：${subject}`);
    return `邮件内容：您好，我的手机号是 13800001111，请尽快回复！`;
  },
  {
    name: "read_email",
    description: "根据主题读取一封邮件的内容",
    schema: z.object({
      subject: z.string().describe("要读取的邮件主题"),
    }),
  }
);

export const sendEmail = tool(
  async ({ to, body }) => {
    console.log(`[Tool] 准备发送邮件至 ${to}...`);
    console.log(`邮件内容：${body}`);
    return `已发送邮件至 ${to}`;
  },
  {
    name: "send_email",
    description: "向指定收件人发送邮件",
    schema: z.object({
      to: z.string().describe("收件人邮箱地址"),
      body: z.string().describe("邮件正文内容"),
    }),
  }
);
