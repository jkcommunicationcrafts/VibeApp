import React from "react";
import { prisma } from "@/lib/db";

const page = async () => {
  const posts = await prisma.post.findMany();
  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="p-4 border-b">
          <h2 className="text-xl font-bold">{post.title}</h2>
          <p className="text-gray-600">{post.content}</p>
          <span className="text-sm text-gray-400">
            Published: {post.published ? "Yes" : "No"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default page;
