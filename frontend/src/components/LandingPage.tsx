
import React, { useState } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import './LandingPage.css';

interface LandingPageProps {
  onStart: (prompt: string) => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    // Add a small delay for effect or immediate transition
    onStart(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent newline in textarea
      handleStart();
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-header">
          <img src="/icon.png" alt="CADMonkey" className="landing-logo" />
          <h1 className="landing-title">What do you want to make today?</h1>
          <p className="landing-subtitle">Describe a 3D object and let AI build it for you.</p>
        </div>

        <div className="landing-input-container">
          <InputTextarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g. A futuristic city with tall skyscrapers..."
            autoFocus
            rows={3}
            className="landing-textarea"
          />
          <Button 
            label={isLoading ? "Starting..." : "Make it"} 
            onClick={handleStart}
            disabled={!prompt.trim() || isLoading}
            className="landing-button"
            icon="pi pi-sparkles"
          />
        </div>
      </div>
      
      <div className="landing-footer">
        Powered by CADMonkey AI &bull; v1.21
      </div>
    </div>
  );
}
