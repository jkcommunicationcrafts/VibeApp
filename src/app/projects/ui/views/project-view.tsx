"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { MessagesContainer } from "../componenents/messages-container";
import { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../componenents/project-header";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {

  const [activeFragment,setActiveFragment] = useState<Fragment|null>(null)
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >   
        <Suspense fallback={<p>Project Loading...</p>}>
            <ProjectHeader projectId={projectId}/>
            </Suspense>
          <Suspense fallback={<div>Loading messages...</div>}>
            <MessagesContainer 
            projectId={projectId} 
            activeFragment = {activeFragment}
            setActiveFragment = {setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={65} minSize={50}>
          TODO:Preview
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
