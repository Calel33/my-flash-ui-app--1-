/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GOOGLE_FONTS } from '../constants';

export interface ElementData {
    tagName: string;
    id: string;
    className: string;
    textContent: string;
    href: string;
    computedStyles: {
        marginTop: string;
        marginRight: string;
        marginBottom: string;
        marginLeft: string;
        paddingTop: string;
        paddingRight: string;
        paddingBottom: string;
        paddingLeft: string;
        backgroundColor: string;
        color: string;
        fontSize: string;
        fontFamily: string;
        fontWeight: string;
        lineHeight: string;
        letterSpacing: string;
        textAlign: string;
        borderRadius: string;
        borderWidth: string;
        borderColor: string;
        width: string;
        height: string;
        display: string;
        position: string;
        gap: string;
        justifyContent: string;
        alignItems: string;
        boxShadow: string;
        opacity: string;
        transform: string;
    };
    path: number[]; // Index path to locate element in DOM
}

interface ElementEditorProps {
    element: ElementData | null;
    isOpen: boolean;
    onClose: () => void;
    onApplyChanges: (changes: Partial<ElementData['computedStyles']> & { textContent?: string; href?: string }) => void;
    onSave: () => void;
}

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="editor-section">
            <button className="section-header" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <span className="section-chevron">{isOpen ? '▼' : '▶'}</span>
            </button>
            {isOpen && <div className="section-content">{children}</div>}
        </div>
    );
};

interface PropertyRowProps {
    label: string;
    children: React.ReactNode;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, children }) => (
    <div className="property-row">
        <label className="property-label">{label}</label>
        <div className="property-input">{children}</div>
    </div>
);

interface SpacingControlProps {
    label: string;
    top: string;
    right: string;
    bottom: string;
    left: string;
    onChange: (side: 'top' | 'right' | 'bottom' | 'left', value: string) => void;
}

const SpacingControl: React.FC<SpacingControlProps> = ({ label, top, right, bottom, left, onChange }) => {
    const parseValue = (val: string) => parseInt(val) || 0;
    return (
        <div className="spacing-control">
            <div className="spacing-label">{label}</div>
            <div className="spacing-grid">
                <div className="spacing-top">
                    <input type="number" value={parseValue(top)} onChange={(e) => onChange('top', e.target.value + 'px')} />
                </div>
                <div className="spacing-middle">
                    <input type="number" value={parseValue(left)} onChange={(e) => onChange('left', e.target.value + 'px')} />
                    <div className="spacing-center-box" />
                    <input type="number" value={parseValue(right)} onChange={(e) => onChange('right', e.target.value + 'px')} />
                </div>
                <div className="spacing-bottom">
                    <input type="number" value={parseValue(bottom)} onChange={(e) => onChange('bottom', e.target.value + 'px')} />
                </div>
            </div>
        </div>
    );
};

const ElementEditor: React.FC<ElementEditorProps> = ({ element, isOpen, onClose, onApplyChanges, onSave }) => {
    const [localStyles, setLocalStyles] = useState<ElementData['computedStyles'] | null>(null);
    const [localText, setLocalText] = useState('');
    const [localHref, setLocalHref] = useState('');
    const [activeTab, setActiveTab] = useState<'edit' | 'code'>('edit');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (element) {
            setLocalStyles({ ...element.computedStyles });
            setLocalText(element.textContent || '');
            setLocalHref(element.href || '');
            setHasChanges(false);
        }
    }, [element]);

    const handleStyleChange = useCallback((property: keyof ElementData['computedStyles'], value: string) => {
        setLocalStyles(prev => prev ? { ...prev, [property]: value } : null);
        onApplyChanges({ [property]: value });
        setHasChanges(true);
    }, [onApplyChanges]);

    const handleTextChange = useCallback((value: string) => {
        setLocalText(value);
        onApplyChanges({ textContent: value });
        setHasChanges(true);
    }, [onApplyChanges]);

    const handleHrefChange = useCallback((value: string) => {
        setLocalHref(value);
        onApplyChanges({ href: value });
        setHasChanges(true);
    }, [onApplyChanges]);

    const handleSave = useCallback(() => {
        onSave();
        setHasChanges(false);
    }, [onSave]);

    if (!isOpen || !element || !localStyles) return null;

    const isLink = element.tagName.toLowerCase() === 'a';

    return (
        <div className="element-editor-overlay" onClick={onClose}>
            <div className="element-editor-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="editor-header">
                    <div className="editor-tag-info">
                        <span className="tag-name">{element.tagName.toUpperCase()}</span>
                        {element.id && <span className="tag-id">#{element.id}</span>}
                    </div>
                    <div className="editor-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                            onClick={() => setActiveTab('edit')}
                        >
                            EDIT
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                            onClick={() => setActiveTab('code')}
                        >
                            CODE
                        </button>
                    </div>
                    <button className="editor-close-btn" onClick={onClose}>×</button>
                </div>

                {/* Body */}
                <div className="editor-body">
                    {activeTab === 'edit' ? (
                        <>
                            {/* Link (if applicable) */}
                            {isLink && (
                                <CollapsibleSection title="Link" defaultOpen>
                                    <PropertyRow label="URL">
                                        <input
                                            type="text"
                                            value={localHref}
                                            onChange={(e) => handleHrefChange(e.target.value)}
                                            placeholder="/page or url..."
                                        />
                                    </PropertyRow>
                                </CollapsibleSection>
                            )}

                            {/* Text Content */}
                            <CollapsibleSection title="Text Content" defaultOpen>
                                <PropertyRow label="Text">
                                    <input
                                        type="text"
                                        value={localText}
                                        onChange={(e) => handleTextChange(e.target.value)}
                                        placeholder="Enter text content..."
                                    />
                                </PropertyRow>
                            </CollapsibleSection>

                            {/* Element ID & Classes */}
                            <CollapsibleSection title="Element ID">
                                <PropertyRow label="ID">
                                    <input type="text" value={element.id} readOnly placeholder="No ID" />
                                </PropertyRow>
                                <PropertyRow label="Classes">
                                    <input type="text" value={element.className} readOnly placeholder="No classes" />
                                </PropertyRow>
                            </CollapsibleSection>

                            {/* Spacing */}
                            <CollapsibleSection title="Margin" defaultOpen>
                                <SpacingControl
                                    label="Margin"
                                    top={localStyles.marginTop}
                                    right={localStyles.marginRight}
                                    bottom={localStyles.marginBottom}
                                    left={localStyles.marginLeft}
                                    onChange={(side, value) => {
                                        const prop = `margin${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof ElementData['computedStyles'];
                                        handleStyleChange(prop, value);
                                    }}
                                />
                            </CollapsibleSection>

                            <CollapsibleSection title="Padding" defaultOpen>
                                <SpacingControl
                                    label="Padding"
                                    top={localStyles.paddingTop}
                                    right={localStyles.paddingRight}
                                    bottom={localStyles.paddingBottom}
                                    left={localStyles.paddingLeft}
                                    onChange={(side, value) => {
                                        const prop = `padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof ElementData['computedStyles'];
                                        handleStyleChange(prop, value);
                                    }}
                                />
                            </CollapsibleSection>

                            {/* Size */}
                            <CollapsibleSection title="Size">
                                <PropertyRow label="Width">
                                    <input
                                        type="text"
                                        value={localStyles.width}
                                        onChange={(e) => handleStyleChange('width', e.target.value)}
                                        placeholder="auto"
                                    />
                                </PropertyRow>
                                <PropertyRow label="Height">
                                    <input
                                        type="text"
                                        value={localStyles.height}
                                        onChange={(e) => handleStyleChange('height', e.target.value)}
                                        placeholder="auto"
                                    />
                                </PropertyRow>
                            </CollapsibleSection>

                            {/* Typography */}
                            <CollapsibleSection title="Typography" defaultOpen>
                                <PropertyRow label="Font">
                                    <select
                                        value={extractFontName(localStyles.fontFamily)}
                                        onChange={(e) => {
                                            const font = e.target.value;
                                            handleStyleChange('fontFamily', `"${font}", sans-serif`);
                                            // Load the font dynamically
                                            loadGoogleFont(font);
                                        }}
                                        className="font-select"
                                    >
                                        <option value="">System Default</option>
                                        <optgroup label="Sans Serif">
                                            {GOOGLE_FONTS.filter(f => f.category === 'sans-serif').map(font => (
                                                <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>{font.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Serif">
                                            {GOOGLE_FONTS.filter(f => f.category === 'serif').map(font => (
                                                <option key={font.name} value={font.name}>{font.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Monospace">
                                            {GOOGLE_FONTS.filter(f => f.category === 'monospace').map(font => (
                                                <option key={font.name} value={font.name}>{font.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </PropertyRow>
                                <PropertyRow label="Size">
                                    <input
                                        type="text"
                                        value={localStyles.fontSize}
                                        onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                                    />
                                </PropertyRow>
                                <PropertyRow label="Weight">
                                    <select
                                        value={localStyles.fontWeight}
                                        onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                                    >
                                        <option value="100">Thin</option>
                                        <option value="300">Light</option>
                                        <option value="400">Normal</option>
                                        <option value="500">Medium</option>
                                        <option value="600">Semibold</option>
                                        <option value="700">Bold</option>
                                        <option value="900">Black</option>
                                    </select>
                                </PropertyRow>
                                <PropertyRow label="Line H">
                                    <input
                                        type="text"
                                        value={localStyles.lineHeight || 'normal'}
                                        onChange={(e) => handleStyleChange('lineHeight', e.target.value)}
                                        placeholder="normal"
                                    />
                                </PropertyRow>
                                <PropertyRow label="Spacing">
                                    <input
                                        type="text"
                                        value={localStyles.letterSpacing || 'normal'}
                                        onChange={(e) => handleStyleChange('letterSpacing', e.target.value)}
                                        placeholder="normal"
                                    />
                                </PropertyRow>
                                <PropertyRow label="Align">
                                    <select
                                        value={localStyles.textAlign || 'left'}
                                        onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                                    >
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                        <option value="justify">Justify</option>
                                    </select>
                                </PropertyRow>
                                <PropertyRow label="Color">
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={rgbToHex(localStyles.color)}
                                            onChange={(e) => handleStyleChange('color', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localStyles.color}
                                            onChange={(e) => handleStyleChange('color', e.target.value)}
                                        />
                                    </div>
                                </PropertyRow>
                            </CollapsibleSection>

                            {/* Background */}
                            <CollapsibleSection title="Background">
                                <PropertyRow label="Color">
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={rgbToHex(localStyles.backgroundColor)}
                                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localStyles.backgroundColor}
                                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                        />
                                    </div>
                                </PropertyRow>
                            </CollapsibleSection>

                            {/* Border */}
                            <CollapsibleSection title="Border">
                                <PropertyRow label="Width">
                                    <input
                                        type="text"
                                        value={localStyles.borderWidth}
                                        onChange={(e) => handleStyleChange('borderWidth', e.target.value)}
                                        placeholder="0px"
                                    />
                                </PropertyRow>
                                <PropertyRow label="Color">
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={rgbToHex(localStyles.borderColor)}
                                            onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localStyles.borderColor}
                                            onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                        />
                                    </div>
                                </PropertyRow>
                                <PropertyRow label="Radius">
                                    <input
                                        type="text"
                                        value={localStyles.borderRadius}
                                        onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                                        placeholder="0px"
                                    />
                                </PropertyRow>
                            </CollapsibleSection>

                            {/* Spacing & Layout */}
                            <CollapsibleSection title="Spacing">
                                <PropertyRow label="Gap">
                                    <input
                                        type="text"
                                        value={localStyles.gap || '0'}
                                        onChange={(e) => handleStyleChange('gap', e.target.value)}
                                        placeholder="0px"
                                    />
                                </PropertyRow>
                                <PropertyRow label="Justify">
                                    <select
                                        value={localStyles.justifyContent || 'flex-start'}
                                        onChange={(e) => handleStyleChange('justifyContent', e.target.value)}
                                    >
                                        <option value="flex-start">Start</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">End</option>
                                        <option value="space-between">Space Between</option>
                                        <option value="space-around">Space Around</option>
                                        <option value="space-evenly">Space Evenly</option>
                                    </select>
                                </PropertyRow>
                                <PropertyRow label="Align">
                                    <select
                                        value={localStyles.alignItems || 'flex-start'}
                                        onChange={(e) => handleStyleChange('alignItems', e.target.value)}
                                    >
                                        <option value="flex-start">Start</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">End</option>
                                        <option value="stretch">Stretch</option>
                                        <option value="baseline">Baseline</option>
                                    </select>
                                </PropertyRow>
                            </CollapsibleSection>

                            {/* Effects */}
                            <CollapsibleSection title="Effects">
                                <PropertyRow label="Shadow">
                                    <input
                                        type="text"
                                        value={localStyles.boxShadow === 'none' ? '' : localStyles.boxShadow || ''}
                                        onChange={(e) => handleStyleChange('boxShadow', e.target.value || 'none')}
                                        placeholder="0 4px 6px rgba(0,0,0,0.1)"
                                    />
                                </PropertyRow>
                                <PropertyRow label="Opacity">
                                    <div className="slider-row">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={Math.round(parseFloat(localStyles.opacity || '1') * 100)}
                                            onChange={(e) => handleStyleChange('opacity', (parseInt(e.target.value) / 100).toString())}
                                        />
                                        <span className="slider-value">{Math.round(parseFloat(localStyles.opacity || '1') * 100)}%</span>
                                    </div>
                                </PropertyRow>
                            </CollapsibleSection>

                            {/* Transforms */}
                            <CollapsibleSection title="Transforms">
                                <PropertyRow label="Transform">
                                    <input
                                        type="text"
                                        value={localStyles.transform === 'none' ? '' : localStyles.transform || ''}
                                        onChange={(e) => handleStyleChange('transform', e.target.value || 'none')}
                                        placeholder="rotate(0deg) scale(1)"
                                    />
                                </PropertyRow>
                            </CollapsibleSection>
                        </>
                    ) : (
                        <div className="code-view">
                            <pre className="element-code">
                                {`/* Computed Styles */
${Object.entries(localStyles).map(([k, v]) => `${camelToKebab(k)}: ${v};`).join('\n')}`}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer with Save Button */}
                <div className="editor-footer">
                    <button
                        className={`save-btn ${hasChanges ? 'has-changes' : ''}`}
                        onClick={handleSave}
                        disabled={!hasChanges}
                    >
                        {hasChanges ? '💾 Save Changes' : '✓ Saved'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper: Convert RGB to Hex
function rgbToHex(rgb: string): string {
    if (!rgb || rgb === 'transparent' || rgb.startsWith('#')) return rgb || '#000000';
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';
    const [, r, g, b] = match.map(Number);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Helper: Convert camelCase to kebab-case
function camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper: Extract font name from CSS font-family string
function extractFontName(fontFamily: string): string {
    if (!fontFamily) return '';
    // Remove quotes and get the first font name
    const match = fontFamily.match(/["']?([^"',]+)["']?/);
    return match ? match[1].trim() : '';
}

// Helper: Load a Google Font dynamically
function loadGoogleFont(fontName: string): void {
    if (!fontName) return;

    // Check if already loaded
    const existingLink = document.querySelector(`link[href*="${fontName.replace(/\s+/g, '+')}"]`);
    if (existingLink) return;

    // Create link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
}

export default ElementEditor;
