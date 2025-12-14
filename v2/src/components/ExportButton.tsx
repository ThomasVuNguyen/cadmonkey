import React, { useState } from 'react';
import { spawnOpenSCAD } from '../lib/runner/openscad-runner';

interface ExportButtonProps {
  scadCode: string;
  disabled?: boolean;
}

type ExportFormat = 'stl' | 'glb' | '3mf' | 'off';

export default function ExportButton({ scadCode, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const exportAs = async (format: ExportFormat) => {
    if (!scadCode.trim() || isExporting) return;

    setIsExporting(true);
    setShowDropdown(false);

    try {
      console.log(`Exporting as ${format.toUpperCase()}...`);

      // Run OpenSCAD compilation
      const job = spawnOpenSCAD(
        {
          mountArchives: true,
          inputs: [{
            path: '/model.scad',
            content: scadCode,
          }],
          args: [
            '/model.scad',
            '-o', `/output.${format}`,
            '--backend=manifold',
            `--export-format=${format}`,
            '--enable=lazy-union',
          ],
          outputPaths: [`output.${format}`],
        },
        () => {} // Stream callback
      );

      const result = await job;

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.outputs || result.outputs.length === 0) {
        throw new Error('No output generated');
      }

      // Get the output file
      const [filename, dataUrl] = result.outputs[0];

      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `model.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`✅ Exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrimaryExport = () => {
    exportAs('stl'); // Default to STL
  };

  return (
    <div className="relative">
      {/* Primary Button with Dropdown */}
      <div className="flex items-center gap-0">
        {/* Main Export Button */}
        <button
          onClick={handlePrimaryExport}
          disabled={disabled || isExporting || !scadCode.trim()}
          className="bg-[#1e53f1] text-white px-4 py-2 rounded-l-lg hover:bg-[#1a47d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export STL
            </>
          )}
        </button>

        {/* Dropdown Toggle */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || isExporting || !scadCode.trim()}
          className="bg-[#1e53f1] text-white px-2 py-2 rounded-r-lg border-l border-[#1a47d1] hover:bg-[#1a47d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={() => exportAs('stl')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                STL (3D Printing)
              </button>
              <button
                onClick={() => exportAs('glb')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                GLB (3D Web)
              </button>
              <button
                onClick={() => exportAs('3mf')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                3MF (Advanced)
              </button>
              <button
                onClick={() => exportAs('off')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                OFF (Mesh)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
