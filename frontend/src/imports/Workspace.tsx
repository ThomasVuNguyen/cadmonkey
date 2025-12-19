import React, { useState, useRef, useEffect } from "react";
import svgPaths from "./svg-227mre0lzr";
import cadmonkeyLogo from "../assets/cadmonkey.png";
import Gallery from "../components/Gallery";
import { ModelService } from "../services/firestore";
import { spawnOpenSCAD } from "../lib/runner/openscad-runner";
import { parseOff } from "../lib/io/import_off";
import { exportGlb } from "../lib/io/export_glb";
import packageJson from "../../package.json";

// Hook to detect mobile screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

const APP_VERSION = `v${packageJson.version}`;

function LovableLogo() {
  return (
    <div className="relative shrink-0 size-[36px] flex items-center justify-center" data-name="lovable logo">
      <img alt="CadMonkey Logo" className="max-w-full max-h-full object-contain pointer-events-none" src={cadmonkeyLogo} />
    </div>
  );
}

function Frame4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
      <div className="flex flex-row items-center gap-[8px] font-medium leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#F3F1E4] text-[16px] text-nowrap w-full">
        <p className="leading-[normal] overflow-ellipsis overflow-hidden">cadmonkey</p>
        <span className="text-[12px] font-normal text-[#d7d7d2] bg-[#2d2d2d] px-[6px] py-[2px] rounded-[10px] border border-[rgba(243,241,228,0.15)]">
          {APP_VERSION}
        </span>
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

function ProjectMenuMobile() {
  return (
    <div className="content-stretch flex gap-[12px] items-center p-[6px] relative shrink-0" data-name="Project Menu Mobile">
      <LovableLogo />
      <Frame4 />
    </div>
  );
}

function DiscordButton() {
  return (
    <a
      href="https://discord.gg/qgT4saW3pp"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-[8px] px-[12px] py-[6px] bg-[#5865F2] hover:bg-[#4752C4] rounded-[8px] transition-colors shrink-0"
      style={{ textDecoration: 'none' }}
    >
      <svg width="20" height="20" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#F3F1E4" />
      </svg>
      <span className="text-[#F3F1E4] text-[14px] font-medium">Discord</span>
    </a>
  );
}

function HowIsThisBuiltButton() {
  return (
    <a
      href="https://starmind.comfyspace.tech/experiments/cadmonkey-v2/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-[6px] px-[10px] py-[6px] bg-transparent hover:bg-[rgba(243,241,228,0.1)] rounded-[8px] transition-all duration-200 shrink-0 group border border-transparent hover:border-[rgba(243,241,228,0.1)]"
      style={{ textDecoration: 'none' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 group-hover:opacity-100 transition-opacity">
        <path d="M16 18L22 12L16 6" stroke="#F3F1E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6L2 12L8 18" stroke="#F3F1E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[#F3F1E4] text-[13px] font-medium opacity-80 group-hover:opacity-100 transition-opacity">How is this built</span>
    </a>
  );
}

function Frame3() {
  return <div className="content-stretch flex gap-[12px] items-center shrink-0" />;
}

function LeftSide({ activeView, onViewChange }: { activeView: 'workspace' | 'gallery', onViewChange: (view: 'workspace' | 'gallery') => void }) {
  return (
    <div className="content-stretch flex items-center gap-[12px] p-[2px] relative shrink-0" data-name="Left Side">
      <ProjectMenu1 />
      <Tabs activeView={activeView} onViewChange={onViewChange} />
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

function TabGroupCompactPrimary({ activeView, onViewChange, isMobile }: { activeView: 'workspace' | 'gallery', onViewChange: (view: 'workspace' | 'gallery') => void, isMobile?: boolean }) {
  const workspaceRef = useRef<HTMLButtonElement>(null);
  const galleryRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const activeButton = activeView === 'workspace' ? workspaceRef.current : galleryRef.current;
    if (activeButton) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        const buttonRect = activeButton.getBoundingClientRect();
        const containerRect = activeButton.parentElement?.getBoundingClientRect();
        if (containerRect) {
          setIndicatorStyle({
            width: buttonRect.width,
            left: buttonRect.left - containerRect.left
          });
        }
      });
    }
  }, [activeView]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: isMobile ? '#212121' : '#2a2a2a',
      borderRadius: '8px',
      padding: isMobile ? '6px' : '4px',
      gap: '4px',
      position: 'relative',
      width: isMobile ? '100%' : 'auto',
      maxWidth: isMobile ? '300px' : 'none'
    }} data-name="Tab Group Compact Primary">
      {/* Sliding background indicator - sized to fit the active button */}
      {indicatorStyle.width > 0 && (
        <div style={{
          position: 'absolute',
          top: '4px',
          bottom: '4px',
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          backgroundColor: '#212121',
          borderRadius: '6px',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0
        }} />
      )}

      {/* Workspace button */}
      <button
        ref={workspaceRef}
        onClick={() => onViewChange('workspace')}
        style={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'transparent',
          color: activeView === 'workspace' ? '#F3F1E4' : '#a0a0a0',
          padding: isMobile ? '10px 16px' : '8px 20px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: isMobile ? '15px' : '14px',
          fontWeight: activeView === 'workspace' ? 500 : 400,
          transition: 'color 150ms ease-out',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          flex: isMobile ? 1 : 'none'
        }}
        role="button"
        aria-pressed={activeView === 'workspace'}
      >
        Workspace
      </button>

      {/* Gallery button */}
      <button
        ref={galleryRef}
        onClick={() => onViewChange('gallery')}
        style={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'transparent',
          color: activeView === 'gallery' ? '#F3F1E4' : '#a0a0a0',
          padding: isMobile ? '10px 16px' : '8px 20px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: isMobile ? '15px' : '14px',
          fontWeight: activeView === 'gallery' ? 500 : 400,
          transition: 'color 150ms ease-out',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          flex: isMobile ? 1 : 'none'
        }}
        role="button"
        aria-pressed={activeView === 'gallery'}
      >
        Gallery
      </button>
    </div>
  );
}

function Tabs({ activeView, onViewChange, isMobile }: { activeView: 'workspace' | 'gallery', onViewChange: (view: 'workspace' | 'gallery') => void, isMobile?: boolean }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Tabs">
      <TabGroupCompactPrimary activeView={activeView} onViewChange={onViewChange} isMobile={isMobile} />
    </div>
  );
}

function VersionBadge() {
  return (
    <div className="content-stretch flex items-center justify-center px-3 py-1 bg-[#3a3a3a] text-[#a0a0a0] text-xs font-medium rounded-full shrink-0">
      {APP_VERSION}
    </div>
  );
}

function PrimaryButtonCompact({ onClick, disabled }: { onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-[#537CF7] content-stretch flex h-[28px] items-center justify-center px-3 relative rounded-[8px] shrink-0 text-white text-sm font-medium hover:bg-[#4568d4] disabled:opacity-50 disabled:cursor-not-allowed"
      data-name="Primary Button Compact"
      aria-label="Download model"
    >
      Download
    </button>
  );
}

function ButtonComponent1({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Button Component">
      <PrimaryButtonCompact onClick={onClick} disabled={disabled} />
    </div>
  );
}

function DownloadCompact({ onDownload, disabled }: { onDownload: (format: 'stl' | 'glb' | '3mf' | 'off') => void; disabled: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const formats: Array<{ label: string; format: 'stl' | 'glb' | '3mf' | 'off' }> = [
    { label: 'STL (3D printing)', format: 'stl' },
    { label: 'GLB (web/AR)', format: 'glb' },
    { label: '3MF (manufacturing)', format: '3mf' },
    { label: 'OFF (geometry)', format: 'off' },
  ];

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setShowMenu(!showMenu)}
        disabled={disabled}
        style={{
          backgroundColor: '#212121',
          border: 'none',
          backgroundImage: 'none',
          display: 'flex',
          width: '48px',
          height: '48px',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          flexShrink: 0,
          transition: 'all 150ms ease-out',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
        aria-label="Download model"
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#F86F54';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#212121';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M8 2v8M5 7l3 3 3-3" stroke="#F3F1E4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 13h10" stroke="#F3F1E4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {showMenu && !disabled && (
        <div style={{
          position: 'absolute',
          bottom: '56px',
          right: '0',
          backgroundColor: '#2a2a2a',
          border: '1px solid #3a3a3a',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          minWidth: '200px',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {formats.map((item) => (
            <button
              key={item.format}
              onClick={() => {
                onDownload(item.format);
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#f3f1e4',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-out',
                borderBottom: formats.indexOf(item) < formats.length - 1 ? '1px solid rgba(243, 241, 228, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3a3a3a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectActions({ onDownload, disabled }: { onDownload: () => void; disabled: boolean }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Project Actions">
      {!disabled && <DownloadCompact onDownload={onDownload} disabled={disabled} />}
    </div>
  );
}

function RightSide({ activeView, onViewChange, onDownload, downloadDisabled }: { activeView: 'workspace' | 'gallery', onViewChange: (view: 'workspace' | 'gallery') => void, onDownload: () => void, downloadDisabled: boolean }) {
  return (
    <div className="basis-0 content-stretch flex grow items-center justify-end min-h-px min-w-px relative shrink-0 gap-[12px]" data-name="Right Side">
      {/* Toggle removed - now separate from header */}
    </div>
  );
}

function WorkspaceHeader({ activeView, onViewChange, onDownload, downloadDisabled }: { activeView: 'workspace' | 'gallery', onViewChange: (view: 'workspace' | 'gallery') => void, onDownload: () => void, downloadDisabled: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: 'fit-content' }} data-name="Workspace Header">
      <LeftSide activeView={activeView} onViewChange={onViewChange} />
    </div>
  );
}

function DateTime() {
  return <div className="content-center flex flex-wrap items-center justify-center shrink-0 w-full" data-name="Date & Time" />;
}

function Message({ content }: { content: string }) {
  return (
    <div className="bg-[#2a2a2a] content-stretch flex items-center justify-end p-[12px] relative rounded-[12px] shrink-0 w-[326px]" data-name="Message">
      <p className="basis-0 font-normal grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#F3F1E4] text-[12px] text-right whitespace-pre-wrap">{content}</p>
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

function Message1({ content, isWakingUp }: { content: string; isWakingUp?: boolean }) {
  const isEmpty = !content || content.trim() === '';

  return (
    <div className="bg-[#2a2a2a] relative rounded-[12px] shrink-0 w-full" data-name="Message">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[12px] relative w-full">
          {isEmpty ? (
            <div
              className="basis-0 font-normal grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#F3F1E4] text-[14px] generating-pulse"
            >
              {isWakingUp ? 'Processing...' : 'Generating...'}
            </div>
          ) : (
            <div className="basis-0 font-normal grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#F3F1E4] text-[14px]">
              <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditsAccordion() {
  return <div className="content-stretch flex flex-col items-start shrink-0 w-full" data-name="Edits Accordion" />;
}

function AiResponse({ content, isWakingUp }: { content: string; isWakingUp?: boolean }) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start justify-center relative shrink-0 w-full" data-name="AI response">
      <Message1 content={content} isWakingUp={isWakingUp} />
      <EditsAccordion />
    </div>
  );
}

function Frame1({ messages, isWakingUp }: { messages: { role: 'user' | 'assistant', content: string }[]; isWakingUp?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="basis-0 content-stretch flex flex-col gap-[24px] grow items-start min-h-px min-w-px overflow-x-clip overflow-y-auto relative shrink-0 w-full">
      <DateTime />
      {messages.map((msg, index) => (
        msg.role === 'user' ? (
          <UserResponse key={index} content={msg.content} />
        ) : (
          <AiResponse key={index} content={msg.content} isWakingUp={index === messages.length - 1 && msg.role === 'assistant' && isWakingUp} />
        )
      ))}
    </div>
  );
}


import Mini3DViewer from "../components/Mini3DViewer";

// ... [existing imports]

// Backend URL - uses environment variable
// In development: /api/generate (proxied by Vite)
// In production: direct Modal URL
const STREAM_URL = import.meta.env.VITE_API_URL || "/api/generate";

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

function Container({ prompt, setPrompt, handleGenerate, isLoading, isMobile }: any) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isMobile && textareaRef.current) {
      const textarea = textareaRef.current;

      const handleFocus = () => {
        // Use visualViewport if available for better keyboard handling
        if (window.visualViewport) {
          const scrollIntoView = () => {
            // Scroll the input container into view
            const inputContainer = textarea.closest('[data-name="AI Chat Input"]');
            if (inputContainer) {
              inputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          };

          // Delay to allow keyboard to start opening
          setTimeout(scrollIntoView, 100);

          // Also handle viewport resize (keyboard opening/closing)
          const handleResize = () => {
            setTimeout(scrollIntoView, 100);
          };

          window.visualViewport.addEventListener('resize', handleResize);
          return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
          };
        } else {
          // Fallback for browsers without visualViewport
          setTimeout(() => {
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      };

      textarea.addEventListener('focus', handleFocus);
      return () => textarea.removeEventListener('focus', handleFocus);
    }
  }, [isMobile]);

  return (
    <div className="basis-0 content-stretch flex grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Container">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="type in an object name, like a cat, a dinosaur, or an ancient dragon"
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
          }
        }}
        className="size-full bg-transparent border-none outline-none resize-none font-normal text-[#F3F1E4] text-[14px] placeholder:text-[#666]"
      />
    </div>
  );
}

function SecondaryButtonCompact({ onClick, disabled }: any) {
  return (
    <div onClick={!disabled ? onClick : undefined} className={`bg-[#3a3a3a] content-stretch flex h-[28px] items-center justify-center p-[6px] relative rounded-[8px] shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#4a4a4a]'}`} data-name="Secondary Button Compact">
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

function AiChatInput({ prompt, setPrompt, handleGenerate, isLoading, isMobile }: any) {
  return (
    <div
      className="bg-[#2a2a2a] h-[140px] relative rounded-[16px] shrink-0 w-full"
      data-name="AI Chat Input"
    >
      <div aria-hidden="true" className="absolute border border-[rgba(243,241,228,0.15)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-start p-[12px] relative size-full">
          <Container prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} isMobile={isMobile} />
          <ButtonGroup1 onClick={handleGenerate} disabled={isLoading || !prompt.trim()} />
        </div>
      </div>
    </div>
  );
}

function AiChatBox({ prompt, setPrompt, handleGenerate, isLoading, messages, isMobile, isWakingUp }: any) {
  return (
    <div className={`content-stretch flex flex-col gap-[24px] ${isMobile ? 'h-full w-full' : 'h-full shrink-0 w-[500px]'} items-start p-[12px] relative`} data-name="AI Chat Box">
      <Frame1 messages={messages} isWakingUp={isWakingUp} />
      {!isMobile && <AiChatInput prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} />}
    </div>
  );
}

function WorkspacePreview({ scadCode, isLoading, onDownload, downloadDisabled, isMobile }: any) {
  return (
    <div
      className={`basis-0 bg-[#F5F5F5] grow min-w-px rounded-[16px] shrink-0 overflow-hidden flex flex-col`}
      style={{ position: 'relative', flex: '1 1 0%', minHeight: 0 }}
      data-name="Workspace Preview"
    >
      <div aria-hidden="true" className="absolute border border-[rgba(243,241,228,0.15)] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_4px_14px_0px_rgba(0,0,0,0.3),0px_4px_14px_0px_rgba(0,0,0,0.15)] z-0" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="text-sm text-gray-300 font-medium">Generating Code...</div>
        </div>
      )}
      <div className="flex-1 relative z-10" style={{ position: 'relative', minHeight: 0, height: '100%' }}>
        <Mini3DViewer scadCode={scadCode} />
        {!downloadDisabled && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            top: 'auto',
            left: 'auto',
            zIndex: 30,
            pointerEvents: 'auto',
            margin: 0,
            padding: 0
          }}>
            <DownloadCompact onDownload={onDownload} disabled={downloadDisabled} />
          </div>
        )}
      </div>
    </div>
  );
}

function Frame2({ prompt, setPrompt, handleGenerate, isLoading, scadCode, messages, onDownload, downloadDisabled, isMobile, isWakingUp }: any) {
  // For mobile: show code generation first, then replace with 3D view when done
  const [showMobile3DView, setShowMobile3DView] = useState(false);
  const show3DView = isMobile && showMobile3DView && scadCode.trim();
  const showCodeGeneration = isMobile && !showMobile3DView;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Switch to 3D view after code generation completes
  useEffect(() => {
    if (isMobile && !isLoading && scadCode.trim()) {
      // Wait a bit after loading completes to show the full generated code
      const timer = setTimeout(() => {
        setShowMobile3DView(true);
      }, 1500); // 1.5 second delay to show completed code
      return () => clearTimeout(timer);
    } else if (isMobile && isLoading) {
      // Reset when new generation starts
      setShowMobile3DView(false);
    }
  }, [isMobile, isLoading, scadCode]);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile) return;

    const updateKeyboardHeight = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const heightDiff = windowHeight - viewportHeight;
        setKeyboardHeight(heightDiff > 150 ? heightDiff : 0); // Only consider it keyboard if > 150px
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardHeight);
      updateKeyboardHeight();
      return () => {
        window.visualViewport?.removeEventListener('resize', updateKeyboardHeight);
      };
    }
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="basis-0 content-stretch flex flex-col grow min-h-px min-w-px relative shrink-0 w-full" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Content area - takes available space, scrollable */}
        <div
          className="flex-1 overflow-auto"
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            paddingBottom: keyboardHeight > 0 ? `${160 + keyboardHeight}px` : '160px'
          }}
        >
          {!show3DView && (
            <div className="h-full">
              <AiChatBox prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} messages={messages} isMobile={true} isWakingUp={isWakingUp} />
            </div>
          )}
          {show3DView && (
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <WorkspacePreview scadCode={scadCode} isLoading={isLoading} onDownload={onDownload} downloadDisabled={downloadDisabled} isMobile={true} />
            </div>
          )}
        </div>
        {/* Input field fixed to bottom for mobile - always visible above keyboard */}
        <div
          style={{
            position: 'fixed',
            bottom: keyboardHeight > 0
              ? `${keyboardHeight}px`
              : `calc(60px + max(0px, env(safe-area-inset-bottom)))`, // 60px for bottom nav + safe area
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '0 12px',
            paddingBottom: `max(12px, calc(12px + env(safe-area-inset-bottom)))`,
            backgroundColor: '#212121',
          }}
        >
          <AiChatInput prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} isMobile={true} />
        </div>
      </div>
    );
  }

  // Desktop layout: side-by-side
  return (
    <div className="basis-0 content-stretch flex gap-[12px] grow items-stretch min-h-px min-w-px relative shrink-0 w-full">
      <AiChatBox prompt={prompt} setPrompt={setPrompt} handleGenerate={handleGenerate} isLoading={isLoading} messages={messages} isWakingUp={isWakingUp} />
      <WorkspacePreview scadCode={scadCode} isLoading={isLoading} onDownload={onDownload} downloadDisabled={downloadDisabled} isMobile={false} />
    </div>
  );
}

export default function Workspace() {
  const [activeView, setActiveView] = useState<'workspace' | 'gallery'>('workspace');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [scadCode, setScadCode] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  /* Define default Cat message if we want history, or start empty. Let's start empty for now or use the placeholder. */
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const isMobile = useIsMobile();

  const handleGenerate = async () => {

    console.log("handleGenerate triggered. Prompt:", prompt);
    if (!prompt.trim()) {
      console.log("Empty prompt, aborting.");
      return;
    }

    const userPrompt = prompt;
    setMessages([
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: '' }
    ]);
    setPrompt(''); // Clear input

    setIsLoading(true);
    setIsWakingUp(true); // Start with processing message
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
      let firstTokenReceived = false;

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
                // First token received - switch from "waking up" to "generating"
                if (!firstTokenReceived) {
                  firstTokenReceived = true;
                  setIsWakingUp(false);
                }
                generatedCode += data.token;
                setScadCode(generatedCode);

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

      // Auto-save to Firestore database
      if (generatedCode.trim()) {
        try {
          console.log('💾 Saving model to Firestore...');
          const modelId = await ModelService.saveModel(userPrompt, generatedCode);
          console.log('✅ Model saved with ID:', modelId);
        } catch (saveError) {
          console.error('❌ Failed to save model to Firestore:', saveError);
          // Don't block user workflow if save fails
        }
      }
    } catch (err: any) {
      console.error('Generation failed', err);
      // alert('Generation failed: ' + err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsWakingUp(false);
      setIsLoading(false);
    }
  };

  const handleModelSelect = (selectedScadCode: string, selectedPrompt: string) => {
    setScadCode(selectedScadCode);
    setMessages([
      { role: 'user', content: selectedPrompt },
      { role: 'assistant', content: selectedScadCode }
    ]);
    setActiveView('workspace');
  };

  const handleDownload = async (format: 'stl' | 'glb' | '3mf' | 'off' = 'stl') => {
    if (!scadCode.trim() || isExporting) return;
    setIsExporting(true);
    try {
      // GLB format requires exporting as OFF first, then converting
      const actualFormat = format === 'glb' ? 'off' : format;

      const job = spawnOpenSCAD(
        {
          mountArchives: true,
          inputs: [{ path: '/model.scad', content: scadCode }],
          args: [
            '/model.scad',
            '-o', `/output.${actualFormat}`,
            '--backend=manifold',
            `--export-format=${actualFormat}`,
            '--enable=lazy-union',
          ],
          outputPaths: [`output.${actualFormat}`],
        },
        () => { }
      );

      const result = await job;
      if (result.error) throw new Error(result.error);
      if (!result.outputs || result.outputs.length === 0) {
        throw new Error('No output generated');
      }

      const [, fileContent] = result.outputs[0];

      // Type assertion: fileContent can be string or Uint8Array despite type definition
      const content = fileContent as string | Uint8Array;

      let blob: Blob;

      // Handle GLB conversion
      if (format === 'glb') {
        // Convert OFF to GLB
        let offText = '';
        if (typeof content === 'string') {
          offText = content;
        } else {
          // content is Uint8Array for binary formats
          offText = new TextDecoder().decode(content);
        }

        const offData = parseOff(offText);
        blob = await exportGlb(offData);
      } else {
        // Handle other formats directly
        if (typeof content === 'string') {
          // Text format (OFF)
          blob = new Blob([content], { type: 'text/plain' });
        } else {
          // Binary format (STL, 3MF, OFF) - content is Uint8Array
          // Create a new Uint8Array to ensure proper type compatibility
          const buffer = new Uint8Array(content);
          blob = new Blob([buffer], {
            type: format === 'stl' ? 'model/stl' :
              format === '3mf' ? 'model/3mf' :
                'application/octet-stream'
          });
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `model.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#212121] relative size-full" data-name="Workspace">
      <div className="flex flex-col size-full">
        <div className="content-stretch flex flex-col gap-[6px] items-start p-[12px] relative size-full">
          <div className="flex items-center justify-between w-full gap-[12px]">
            {isMobile ? (
              <>
                <ProjectMenuMobile />
                <div className="flex items-center gap-[8px]">
                  <HowIsThisBuiltButton />
                  <DiscordButton />
                </div>
              </>
            ) : (
              <>
                <WorkspaceHeader
                  activeView={activeView}
                  onViewChange={setActiveView}
                  onDownload={() => { }}
                  downloadDisabled={true}
                />
                <div className="flex items-center gap-[8px]">
                  <HowIsThisBuiltButton />
                  <DiscordButton />
                </div>
              </>
            )}
          </div>
          {activeView === 'workspace' ? (
            <Frame2
              prompt={prompt}
              setPrompt={setPrompt}
              handleGenerate={handleGenerate}
              isLoading={isLoading}
              scadCode={scadCode}
              messages={messages}
              onDownload={handleDownload}
              downloadDisabled={isLoading || isExporting || !scadCode.trim()}
              isMobile={isMobile}
              isWakingUp={isWakingUp}
            />
          ) : (
            <div
              className="basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0 overflow-hidden w-full"
              style={{ height: 'calc(100vh - 140px)' }}
            >
              <Gallery onModelSelect={handleModelSelect} />
            </div>
          )}
        </div>
        {/* Mobile bottom navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#2a2a2a] border-t border-[rgba(243,241,228,0.15)] z-40" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-center p-[8px]">
              <TabGroupCompactPrimary activeView={activeView} onViewChange={setActiveView} isMobile={true} />
            </div>
          </div>
        )}
      </div>
      {showDownloadModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-[4px] flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-[14px] shadow-[0_18px_40px_rgba(0,0,0,0.35)] w-[320px] p-[18px] flex flex-col gap-[12px]">
            <div className="flex items-center justify-between">
              <h3 className="text-[#f3f1e4] text-[16px] font-semibold">Download object</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-[#f3f1e4] text-[18px] leading-none hover:opacity-80"
                aria-label="Close download options"
              >
                ×
              </button>
            </div>
            <p className="text-[#cfcfcf] text-[13px]">Choose a format to export your current model.</p>
            <div className="flex flex-col gap-[8px]">
              <button
                className="w-full bg-[#3a3a3a] text-[#f3f1e4] rounded-[10px] py-[10px] px-[12px] text-left hover:bg-[#4a4a4a] border border-[rgba(243,241,228,0.18)]"
                onClick={() => handleDownload('stl')}
                disabled={isExporting}
              >
                STL (3D printing)
              </button>
              <button
                className="w-full bg-[#3a3a3a] text-[#f3f1e4] rounded-[10px] py-[10px] px-[12px] text-left hover:bg-[#4a4a4a] border border-[rgba(243,241,228,0.18)]"
                onClick={() => handleDownload('glb')}
                disabled={isExporting}
              >
                GLB (web/AR)
              </button>
              <button
                className="w-full bg-[#3a3a3a] text-[#f3f1e4] rounded-[10px] py-[10px] px-[12px] text-left hover:bg-[#4a4a4a] border border-[rgba(243,241,228,0.18)]"
                onClick={() => handleDownload('3mf')}
                disabled={isExporting}
              >
                3MF (manufacturing)
              </button>
              <button
                className="w-full bg-[#3a3a3a] text-[#f3f1e4] rounded-[10px] py-[10px] px-[12px] text-left hover:bg-[#4a4a4a] border border-[rgba(243,241,228,0.18)]"
                onClick={() => handleDownload('off')}
                disabled={isExporting}
              >
                OFF (geometry)
              </button>
            </div>
            <button
              className="w-full text-center text-[#f3f1e4] bg-transparent border border-[rgba(243,241,228,0.18)] rounded-[10px] py-[10px] px-[12px] hover:bg-[#3a3a3a]"
              onClick={() => setShowDownloadModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
