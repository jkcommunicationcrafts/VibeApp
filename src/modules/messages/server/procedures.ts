// import { inngest } from "@/inngest/client";
// import { prisma } from "@/lib/db";
// import { baseProcedure, createTRPCRouter } from "@/trpc/init";
// import z from "zod";

// export const messagesRouter = createTRPCRouter({
//   getMany: baseProcedure.query(async () => {
//     const messages = await prisma.message.findMany({
//       orderBy: { updatedAt: "desc" },
//       //   include: { fragments: true },
//     });
//     return messages;
//   }),
//   create: baseProcedure
//     .input(
//       z.object({
//         value: z
//           .string()
//           .min(1, "Message cannot be empty")
//           .max(1000, "Message cannot be more than 1000 characters"),
//           projectId: z.string().min(1, "Project ID is required"),
//       })
//     )
//     .mutation(async ({ input }) => {
//       const createdMessage = await prisma.message.create({
//         data: {
//             projectId: input.projectId,
//           content: input.value,
//           role: "USER",
//           type: "RESULT",
//         },
//       });

//       await inngest.send({
//         name: "code-agent/run",
//         data: {
//           input: input.value,
//           projectId: input.projectId, // Pass the project 
//         },
//       });
//       return createdMessage;
//     }),
// });
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";

export const messagesRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "Project ID is required"),
      })
    )
    .query(async ({ input }) => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          fragments: true
        },
        orderBy: { updatedAt: "asc" },
        //   include: { fragments: true },
      });
      return messages;
    }),
  create: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, "Message cannot be empty")
          .max(1000, "Message cannot be more than 1000 characters"),
        projectId: z.string().min(1, "Project ID is required"),
      })
    )
    .mutation(async ({ input }) => {
      const createdMessage = await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      });

      await inngest.send({
        name: "code-agent/run",
        data: {
          input: input.value,
          projectId: input.projectId, // Pass the project
        },
      });
      return createdMessage;
    }),
});