import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";

export const messagesRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const messages = await prisma.message.findMany({
      orderBy: { updatedAt: "desc" },
    //   include: { fragments: true },
    });
    return messages;
  }),
  create: baseProcedure
    .input(
      z.object({
        value: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ input }) => {
      const createdMessage = await prisma.message.create({
        data: {
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      });

      await inngest.send({
        name: "code-agent/run",
        data: {
          input: input.value,
        },
      });
      return createdMessage;
    }),
});
