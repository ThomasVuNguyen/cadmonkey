import svgPaths from "./svg-227mre0lzr";
import imgLovableIconBgLightRemovebgPreview1 from "figma:asset/f34f4e53c1ee197ce2bdf05234bc70a842167409.png";

function LovableLogo() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="lovable logo">
      <div className="absolute left-1/2 size-[36px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="lovable-icon-bg-light-removebg-preview 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgLovableIconBgLightRemovebgPreview1} />
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#1c1c1c] text-[16px] text-nowrap w-full">
        <p className="leading-[normal] overflow-ellipsis overflow-hidden">cadmonkey</p>
      </div>
    </div>
  );
}

function ProjectMenu() {
  return (
    <div className="content-stretch flex gap-[12px] items-center p-[6px] relative rounded-[12px] shrink-0 w-[267px]" data-name="Project Menu">
      <LovableLogo />
      <Frame4 />
    </div>
  );
}

function ProjectMenu1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Project Menu">
      <ProjectMenu />
    </div>
  );
}

function Frame3() {
  return <div className="content-stretch flex gap-[12px] items-center shrink-0" />;
}

function LeftSide() {
  return (
    <div className="content-stretch flex items-center justify-between p-[2px] relative shrink-0 w-[500px]" data-name="Left Side">
      <ProjectMenu1 />
      <Frame3 />
    </div>
  );
}

function Language() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="language">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="language">
          <path d={svgPaths.p1056bc00} fill="var(--fill-0, #60605E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TabItemCompact() {
  return (
    <div className="bg-[#fcfbf8] content-stretch flex gap-[2px] items-center justify-center p-[6px] relative rounded-[6px] shrink-0" data-name="Tab Item Compact">
      <div aria-hidden="true" className="absolute border border-[#eceae4] border-solid inset-0 pointer-events-none rounded-[6px] shadow-[0px_4px_14px_0px_rgba(255,255,255,0.1),0px_4px_14px_0px_rgba(0,0,0,0.15)]" />
      <Language />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#1c1c1c] text-[14px] text-nowrap">Workspace</p>
    </div>
  );
}

function Cloud() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Cloud">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Cloud">
          <path d={svgPaths.p19a8d500} fill="var(--fill-0, #60605E)" id="Shape" />
        </g>
      </svg>
    </div>
  );
}

function TabItemCompact1() {
  return (
    <div className="content-stretch flex items-center justify-center p-[6px] relative rounded-[6px] shrink-0" data-name="Tab Item Compact">
      <Cloud />
    </div>
  );
}

function TabGroupCompactPrimary() {
  return (
    <div className="bg-[#f8f4ed] content-stretch flex gap-[6px] items-center p-[2px] relative rounded-[8px] shrink-0" data-name="Tab Group Compact Primary">
      <div aria-hidden="true" className="absolute border border-[#eceae4] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <TabItemCompact />
      <TabItemCompact1 />
    </div>
  );
}

function Tabs() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Tabs">
      <TabGroupCompactPrimary />
    </div>
  );
}

function PricingSecondaryButtonCompact() {
  return (
    <div className="bg-[#f7ebff] content-stretch flex gap-[8px] h-[28px] items-center justify-center p-[6px] relative rounded-[8px] shrink-0" data-name="Pricing Secondary Button Compact">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#60605e] text-[14px] text-nowrap">Upgrade</p>
    </div>
  );
}

function ButtonComponent() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Button Component">
      <PricingSecondaryButtonCompact />
    </div>
  );
}

function PrimaryButtonCompact() {
  return (
    <div className="bg-[#1e53f1] content-stretch flex h-[28px] items-center justify-center p-[6px] relative rounded-[8px] shrink-0" data-name="Primary Button Compact">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-center text-nowrap text-white">Download</p>
    </div>
  );
}

function ButtonComponent1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Button Component">
      <PrimaryButtonCompact />
    </div>
  );
}

function PublishMenu() {
  return (
    <div className="content-stretch flex flex-col items-end relative shrink-0" data-name="Publish Menu">
      <ButtonComponent1 />
    </div>
  );
}

function ProjectActions() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Project Actions">
      <ButtonComponent />
      <PublishMenu />
    </div>
  );
}

function RightSide() {
  return (
    <div className="basis-0 content-stretch flex grow items-center justify-between min-h-px min-w-px relative shrink-0" data-name="Right Side">
      <Tabs />
      <ProjectActions />
    </div>
  );
}

function WorkspaceHeader() {
  return (
    <div className="bg-[#fcfbf8] relative shrink-0 w-full" data-name="Workspace Header">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[24px] items-center pl-0 pr-[20px] py-0 relative w-full">
          <LeftSide />
          <RightSide />
        </div>
      </div>
    </div>
  );
}

function DateTime() {
  return <div className="content-center flex flex-wrap items-center justify-center shrink-0 w-full" data-name="Date & Time" />;
}

function Message({ content }: { content: string }) {
  return (
    <div className="bg-[#f8f4ed] content-stretch flex items-center justify-end p-[12px] relative rounded-[12px] shrink-0 w-[326px]" data-name="Message">
      <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#1c1c1c] text-[12px] text-right whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function Copy() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Copy">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Copy">
          <path d={svgPaths.p15722080} fill="var(--fill-0, #60605E)" id="Shape" />
        </g>
      </svg>
    </div>
  );
}

function GhostButtonCompact() {
  return (
    <div className="content-stretch flex h-[28px] items-center justify-center p-[6px] relative rounded-[8px] shrink-0" data-name="Ghost Button Compact">
      <Copy />
    </div>
  );
}

function ButtonComponent2() {
  return (
    <div className="content-stretch flex items-start opacity-0 relative shrink-0" data-name="Button Component">
      <GhostButtonCompact />
    </div>
  );
}

function UserResponse({ content }: { content: string }) {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-end justify-center relative shrink-0 w-full" data-name="User response">
      <Message content={content} />
      <ButtonComponent2 />
    </div>
  );
}

function Message1({ content }: { content: string }) {
  return (
    <div className="bg-[#fcfbf8] relative rounded-[12px] shrink-0 w-full" data-name="Message">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[12px] relative w-full">
          <div className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#1c1c1c] text-[14px]">
            <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
          </div>
        </div>
      </div>
    </div>
  );


  ;
}

function EditsAccordion() {
  return <div className="content-stretch flex flex-col items-start shrink-0 w-full" data-name="Edits Accordion" />;
}

function AiResponse({ content }: { content: string }) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start justify-center relative shrink-0 w-full" data-name="AI response">
      <Message1 content={content} />
      <EditsAccordion />
    </div>
  );
}

function Frame1({ messages }: { messages: { role: 'user' | 'assistant', content: string }[] }) {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[24px] grow items-start min-h-px min-w-px overflow-x-clip overflow-y-auto relative shrink-0 w-full">
      <DateTime />
      {messages.map((msg, index) => (
        msg.role === 'user' ? (
          <UserResponse key={index} content={msg.content} />
        ) : (
          <AiResponse key={index} content={msg.content} />
        )
      ))}
    </div>
  );
}


import Mini3DViewer from "../components/Mini3DViewer";
import { useState } from "react";

// ... [existing imports]

// Backend URL
const STREAM_URL = "/api/generate";

// [Intermediate components with props]


function AiChatMenu() {
  return <div className="content-stretch flex flex-col items-end shrink-0" data-name="AI Chat Menu" />;
}

function ButtonComponent3() {
  return <div className="content-stretch flex items-start shrink-0" data-name="Button Component" />;
}

function ButtonGroup() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Button Group">
      <AiChatMenu />
      <ButtonComponent3 />
    </div>
  );
}

function ButtonComponent4() {
  return <div className="content-stretch flex items-start shrink-0" data-name="Button Component" />;
}

function ArrowUpward() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow_upward">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow_upward">
          <g id="Vector"></g>
          <path d={svgPaths.pc3d4a00} fill="var(--fill-0, #1C1C1C)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Container({ prompt, setPrompt, handleGenerate, isLoading }: any) {
  return (
    <div className="basis-0 content-stretch flex grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Container">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="what do you want to make?"
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
          }
        }}
        className="size-full bg-transparent border-none outline-none resize-none font-['Inter:Regular',sans-serif] text-[#1c1c1c] text-[14px]"
      />
    </div>
  );
}

function SecondaryButtonCompact({ onClick, disabled }: any) {
  return (
    <div onClick={!disabled ? onClick : undefined} className={`bg-[#cfcecc] content-stretch flex h-[28px] items-center justify-center p-[6px] relative rounded-[8px] shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#b0b0af]'}`} data-name="Secondary Button Compact">
      <ArrowUpward />
    </div>
  );
}

function ButtonComponent5({ onClick, disabled }: any) {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Button Component">
      <SecondaryButtonCompact onClick={onClick} disabled={disabled} />
    </div>
  );
}

function Frame({ onClick, disabled }: any) {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <ButtonComponent4 />
      <ButtonComponent5 onClick={onClick} disabled={disabled} />
    </div>
  );
}

function ButtonGroup1({ onClick, disabled }: any) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Button Group">
      <ButtonGroup />
      <Frame onClick={onClick} disabled={disabled} />
    </div>
  );
}

function AiChatInput({ prompt, setPrompt, handleGenerate, isLoading }: any) {
  return (
    <div className="bg-[#f8f4ed] h-[140px] relative rounded-[16px] shrink-0 w-full" data-name="AI Chat Input">
      <div aria-hidden="true" className="absolute border border-[#eceae4] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start p-[12px] relative size-full">
          <Container prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} />
          <ButtonGroup1 onClick={handleGenerate} disabled={isLoading || !prompt.trim()} />
        </div>
      </div>
    </div>
  );
}

function AiChatBox({ prompt, setPrompt, handleGenerate, isLoading, messages }: any) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] h-full items-start p-[12px] relative shrink-0 w-[500px]" data-name="AI Chat Box">
      <Frame1 messages={messages} />
      <AiChatInput prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} />
    </div>
  );
}

function WorkspacePreview({ scadCode, isLoading }: any) {
  return (
    <div className="basis-0 bg-white grow h-full min-h-px min-w-px relative rounded-[16px] shrink-0 overflow-hidden" data-name="Workspace Preview">
      <div aria-hidden="true" className="absolute border border-[#eceae4] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_4px_14px_0px_rgba(255,255,255,0.1),0px_4px_14px_0px_rgba(0,0,0,0.15)] z-20" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
          <div className="text-sm text-gray-600 font-['Inter:Medium',sans-serif]">Generating Code...</div>
        </div>
      )}
      <Mini3DViewer scadCode={scadCode} />
    </div>
  );
}

function Frame2({ prompt, setPrompt, handleGenerate, isLoading, scadCode, messages }: any) {
  return (
    <div className="basis-0 content-stretch flex gap-[12px] grow items-center min-h-px min-w-px relative shrink-0 w-full">
      <AiChatBox prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} messages={messages} />
      <WorkspacePreview scadCode={scadCode} isLoading={isLoading} />
    </div>
  );
}

export default function Workspace() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scadCode, setScadCode] = useState('');
  /* Define default Cat message if we want history, or start empty. Let's start empty for now or use the placeholder. */
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);

  const handleGenerate = async () => {
    alert("handleGenerate called!"); // Visual debug
    console.log("handleGenerate triggered. Prompt:", prompt);
    if (!prompt.trim()) {
      console.log("Empty prompt, aborting.");
      return;
    }

    const userPrompt = prompt;
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setPrompt(''); // Clear input

    setIsLoading(true);
    console.log("setIsLoading(true) called");

    try {
      console.log("Fetching:", STREAM_URL);
      const response = await fetch(STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `hey cadmonkey, make me ${userPrompt}`,
          max_tokens: 4096,
          temperature: 0.7
        })
      });
      console.log("Fetch response status:", response.status);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let generatedCode = '';

      // Add a placeholder assistant message to stream into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                generatedCode += data.token;

                // Update the last message (assistant) with new token
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content = generatedCode;
                  }
                  return newMsgs;
                });
              }
              if (data.done) break;
            } catch (e) { console.warn(e); }
          }
        }
      }
      setScadCode(generatedCode);
    } catch (err: any) {
      console.error('Generation failed', err);
      // alert('Generation failed: ' + err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#fcfbf8] relative size-full" data-name="Workspace">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col gap-[6px] items-start justify-center p-[12px] relative size-full">
          <WorkspaceHeader />
          <Frame2 prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} scadCode={scadCode} messages={messages} />
        </div>
      </div>
    </div>
  );
}
