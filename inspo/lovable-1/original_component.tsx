import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, AlertCircle } from 'lucide-react';

export default function App() {
const [inputText, setInputText] = useState("");
const [isOverLimit, setIsOverLimit] = useState(false);
const textareaRef = useRef(null);

// Auto-resize textarea logic
useEffect(() => {
if (textareaRef.current) {
// Reset height to auto to correctly calculate scrollHeight for shrinking content
textareaRef.current.style.height = 'auto';
// Set to scrollHeight
textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
}
}, [inputText]);

const handleInputChange = (e) => {
const newText = e.target.value;
// Count words by splitting on whitespace and filtering out empty strings
const wordCount = newText.trim().split(/\s+/).filter(word => word.length > 0).length;

setInputText(newText);
setIsOverLimit(wordCount > 6);
};

return (
<div
    className="relative min-h-screen w-full bg-slate-900 text-white overflow-hidden font-sans selection:bg-purple-500 selection:text-white">

    {/* Background Gradient Mesh */}
    <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Top Left Blue */}
        <div
            className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/40 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow">
        </div>
        {/* Top Right Darker Blue/Purple */}
        <div
            className="absolute top-[-20%] right-[10%] w-[60vw] h-[60vw] bg-indigo-900/50 rounded-full blur-[130px] mix-blend-screen">
        </div>
        {/* Bottom Pink/Magenta */}
        <div
            className="absolute bottom-[-10%] left-[20%] w-[70vw] h-[50vw] bg-pink-600/30 rounded-full blur-[140px] mix-blend-screen">
        </div>
        {/* Bottom Right Red/Orange accent */}
        <div
            className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-rose-600/20 rounded-full blur-[120px] mix-blend-screen">
        </div>

        {/* Noise overlay for texture (optional, subtle) */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
        </div>
    </div>

    {/* Main Content */}
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-20">

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-semibold mb-8 text-center tracking-tight text-white/95">
            What should we build, Thomas?
        </h1>

        {/* Input Card */}
        <div className={`w-full max-w-2xl bg-[#1e1e1e]/90 backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden
            ring-1 transition-all duration-300 ease-in-out ${isOverLimit
            ? 'border-amber-500/30 ring-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
            : 'border-white/10 ring-white/5 focus-within:ring-white/10 focus-within:border-white/20' }`}>
            <div className="p-4 relative">

                {/* Text Area */}
                <textarea ref={textareaRef} value={inputText} onChange={handleInputChange} className={`w-full
                    bg-transparent placeholder-gray-500 resize-none outline-none text-base leading-relaxed
                    scrollbar-hide pr-12 overflow-hidden transition-colors duration-300 ${isOverLimit
                    ? 'text-amber-100/90' : 'text-gray-200' }`} placeholder="Ask anything (max 6 words)..."
                    spellCheck="false" rows={1} />

                {/* Bottom Section: Warning + Button */}
                <div className="flex items-center justify-between mt-2 select-none h-10">

                    {/* Warning Message (Animated) */}
                    <div className={`flex items-center gap-2 text-sm transition-all duration-300 ${isOverLimit
                        ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2' }`}>
                        {isOverLimit && (
                        <>
                            <AlertCircle size={14} className="text-amber-400" />
                            <span className="text-amber-200/70 font-medium">Keep it short & sweet (max 6 words)</span>
                        </>
                        )}
                    </div>

                    {/* Send Button */}
                    <button disabled={isOverLimit} className={`p-2 rounded-full transition-all duration-300
                        shadow-[0_0_15px_rgba(255,255,255,0.3)] ${isOverLimit
                        ? 'bg-white/10 text-white/20 cursor-not-allowed shadow-none scale-90'
                        : 'bg-white text-black hover:bg-gray-200 hover:scale-105 active:scale-95' }`}>
                        <ArrowUp size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>

    </div>

    {/* Custom Styles for hidden scrollbar if needed */}
    <style>
        {
            ` .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }

            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }

            @keyframes pulse-slow {

                0%,
                100% {
                    opacity: 0.8;
                }

                50% {
                    opacity: 0.6;
                }
            }

            .animate-pulse-slow {
                animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            `
        }
    </style>
</div>
);
}