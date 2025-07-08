import React from "react";
import { caller } from '@/trpc/server';


const Page = async () => {
  const data = await caller.creatAI({text: "KK"});
  return <div>{JSON.stringify(data)}</div>;
};

export default Page;
