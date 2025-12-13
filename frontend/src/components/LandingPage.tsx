
import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import './LandingPage.css';

interface LandingPageProps {
  onStart: (prompt: string) => void;
}

const SUGGESTIONS = ['a teddy bear', 'a cute box'];

export function LandingPage({ onStart }: LandingPageProps) {
  const [prompt, setPrompt] = useState('');

  const handleStart = (promptToUse?: string) => {
    const finalPrompt = promptToUse || prompt;
    if (!finalPrompt.trim()) return;
    onStart(finalPrompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-title">Write an object name</h1>
        
        <div className="landing-input-wrapper">
          <InputText 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="a cat"
            autoFocus
            className="landing-input"
          />
          <button
            onClick={() => handleStart()}
            disabled={!prompt.trim()}
            className="landing-submit-button"
            aria-label="Submit"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 17L10 3M10 3L3 10M10 3L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="landing-suggestions">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleStart(suggestion)}
              className="landing-suggestion-button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
