import React, { useContext } from 'react';
import { ModelContext } from './contexts.ts';

import { SplitButton } from 'primereact/splitbutton';
import { MenuItem } from 'primereact/menuitem';

export default function ExportButton({className, style}: {className?: string, style?: React.CSSProperties}) {
    const model = useContext(ModelContext);
    if (!model) throw new Error('No model');
    const state = model.state;

  const ensureRendered = async () => {
    // If no output or in preview mode, render first (full render)
    if (!state.output || state.output.isPreview) {
      await model.render({ isPreview: false, now: true });
    }
  };

  const downloadAs = async (format: string) => {
    if (state.rendering || state.exporting) return;

    if (state.is2D) {
      // format: svg | dxf
      model.setFormats(format as any, undefined);
    } else {
      // format: stl | glb | off | 3mf
      model.setFormats(undefined, format as any);
    }

    await ensureRendered();
    await model.export();
  };

  const dropdownModel: MenuItem[] = state.is2D
    ? [
        { label: 'SVG', icon: 'pi pi-download', command: () => void downloadAs('svg') },
        { label: 'DXF', icon: 'pi pi-download', command: () => void downloadAs('dxf') },
      ]
    : [
        { label: 'STL', icon: 'pi pi-download', command: () => void downloadAs('stl') },
        { label: 'GLB', icon: 'pi pi-download', command: () => void downloadAs('glb') },
        { label: 'OFF', icon: 'pi pi-download', command: () => void downloadAs('off') },
        { label: '3MF', icon: 'pi pi-download', command: () => void downloadAs('3mf') },
      ];

  const handlePrimaryDownload = async () => {
    // Primary click downloads using current selected format (default: STL)
    if (state.is2D) {
      await downloadAs(state.params.exportFormat2D ?? 'svg');
    } else {
      await downloadAs(state.params.exportFormat3D ?? 'stl');
    }
  };

  return (
    <div className={className} style={style}>
      <SplitButton 
        label="Download"
        disabled={state.rendering || state.exporting}
        icon="pi pi-download" 
        model={dropdownModel}
        severity="secondary"
        onClick={() => void handlePrimaryDownload()}
        className="p-button-sm export-button-dark"
      />
    </div>
  );
}
