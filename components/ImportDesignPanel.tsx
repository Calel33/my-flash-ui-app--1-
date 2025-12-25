/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './Icons';
import { ImportedDesignData, parseUploadedHtmlFile } from '../utils';

interface ImportDesignPanelProps {
    onImport: (data: ImportedDesignData, displayName: string, type: 'design-system' | 'component') => void;
    onCancel: () => void;
}

const ImportDesignPanel = ({ onImport, onCancel }: ImportDesignPanelProps) => {
    const [importData, setImportData] = useState<ImportedDesignData | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [importType, setImportType] = useState<'design-system' | 'component'>('component');
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        setError(null);
        try {
            const data = await parseUploadedHtmlFile(file);
            setImportData(data);
            setDisplayName(data.suggestedName);
        } catch (err: any) {
            setError(err.message || 'Failed to parse file');
            setImportData(null);
        }
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleImport = useCallback(() => {
        if (!importData || !displayName.trim()) return;
        onImport(importData, displayName.trim(), importType);
    }, [importData, displayName, importType, onImport]);

    return (
        <div className="import-design-panel">
            <div
                className={`import-dropzone ${isDragging ? 'dragging' : ''} ${importData ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".html,.htm"
                    onChange={handleInputChange}
                    className="import-file-input"
                />
                {importData ? (
                    <div className="import-file-info">
                        <div className="import-file-name">{importData.sourceFilename}</div>
                        <div className="import-file-hint">Click to change file</div>
                    </div>
                ) : (
                    <div className="import-dropzone-content">
                        <UploadIcon />
                        <div className="import-dropzone-text">
                            <span className="import-dropzone-title">Drop HTML file here</span>
                            <span className="import-dropzone-hint">or click to browse</span>
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="import-error">{error}</div>}

            {importData && (
                <div className="import-form">
                    <div className="import-field">
                        <label className="import-label">Design Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="import-input"
                            placeholder="Enter a name for this design"
                        />
                    </div>

                    <div className="import-field">
                        <label className="import-label">Type</label>
                        <div className="import-type-toggle">
                            <button
                                className={`import-type-btn ${importType === 'component' ? 'active' : ''}`}
                                onClick={() => setImportType('component')}
                            >
                                Component
                            </button>
                            <button
                                className={`import-type-btn ${importType === 'design-system' ? 'active' : ''}`}
                                onClick={() => setImportType('design-system')}
                            >
                                Design System
                            </button>
                        </div>
                    </div>

                    <div className="import-preview">
                        <label className="import-label">Preview</label>
                        <div className="import-preview-frame">
                            <iframe
                                srcDoc={importData.html}
                                title="Import Preview"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="import-actions">
                <button className="import-cancel-btn" onClick={onCancel}>
                    Cancel
                </button>
                <button
                    className="import-confirm-btn"
                    onClick={handleImport}
                    disabled={!importData || !displayName.trim()}
                >
                    Import Design
                </button>
            </div>
        </div>
    );
};

export default ImportDesignPanel;
