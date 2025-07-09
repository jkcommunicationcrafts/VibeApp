"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

import React, { useState } from "react";

const Page = () => {
  const trpc = useTRPC();
  const [value, setvalue] = useState("");
  const invoke = useMutation(trpc.invoke.mutationOptions({}));
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Input value={value} onChange={(e) => setvalue(e.target.value)} className="mb-5"/>
      <Button onClick={() => invoke.mutate({ input: value })}>
        Invoke Background job
      </Button>
    </div>
  );
};

export default Page;
