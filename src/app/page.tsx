"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";

import React, { useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const trpc = useTRPC();
  const {data: messages} = useQuery(trpc.messages.getMany.queryOptions())
  const [value, setvalue] = useState("");
  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        toast.success("Message created successfully!");
      },
    })
  );
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Input
        value={value}
        onChange={(e) => setvalue(e.target.value)}
        className="mb-5"
      />
      <Button
        disabled={createMessage.isPending}
        onClick={() => createMessage.mutate({ value: value })}
      >
        Invoke Background job
      </Button>
      {JSON.stringify(messages, null, 2)}
    </div>
  );
};

export default Page;
