
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Artifact, Session, ComponentVariation, LayoutOption, LibraryItem } from './types';
import { INITIAL_PLACEHOLDERS } from './constants';
import { generateId, slugifyName, ImportedDesignData, createArtifactFromImport, createLibraryItemFromImport } from './utils';
import { 
    MODELS, 
    getComponentModels, 
    getDesignSystemModels,
    getDefaultModel,
    isProviderConfigured,
    PROVIDER_CONFIG,
    type ProviderId 
} from './ai/providers';
import {
    generateStyles,
    streamHtmlArtifact,
    streamReactComponent,
    streamSnippetExtraction,
    streamSnippetToReact,
    streamVariations,
    cleanCodeFences,
} from './ai/generate';

type ModelId = string;
type BarPosition = 'bottom' | 'left' | 'right';

import DottedGlowBackground from './components/DottedGlowBackground';
import GlmLoadingIndicator from './components/GlmLoadingIndicator';
import ArtifactCard from './components/ArtifactCard';
import PromptPopup from './components/PromptPopup';
import SideDrawer from './components/SideDrawer';
import ElementEditor, { ElementData } from './components/ElementEditor';
import ImportDesignPanel from './components/ImportDesignPanel';
import {
    ThinkingIcon,
    CodeIcon,
    SparklesIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    GridIcon,
    ReactIcon,
    CopyIcon,
    SelectorIcon,
    DownloadIcon,
    BrainIcon,
    PaletteIcon,
    LibraryIcon,
    SaveIcon,
    TrashIcon,
    UploadIcon,
    PinBottomIcon,
    PinLeftIcon,
    PinRightIcon,
    EyeOffIcon,
    EyeIcon,
    EditIcon
} from './components/Icons';

function App() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
    const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
    const [storedItems, setStoredItems] = useState<LibraryItem[]>([]);
    const [activeSystem, setActiveSystem] = useState<LibraryItem | null>(null);
    const [concurrentGenerations, setConcurrentGenerations] = useState<number>(() => {
        const saved = localStorage.getItem('flash_ui_concurrent_generations');
        return saved ? Math.min(5, Math.max(1, parseInt(saved, 10))) : 3;
    });

    // Provider state (D13)
    const [provider, setProvider] = useState<ProviderId>(() => {
        const saved = localStorage.getItem('flash_ui_provider');
        if (saved === 'gemini' || saved === 'glm' || saved === 'openrouter') {
            return saved;
        }
        return 'gemini';
    });

    // Derive available models based on current provider (D14)
    const availableModels = MODELS.filter(m => m.provider === provider);

    const [componentModel, setComponentModel] = useState<ModelId>(() => {
        const saved = localStorage.getItem('flash_ui_component_model');
        return (saved as ModelId) || 'gemini-3-flash-preview';
    });
    const [designSystemModel, setDesignSystemModel] = useState<ModelId>(() => {
        const saved = localStorage.getItem('flash_ui_design_system_model');
        return (saved as ModelId) || 'gemini-3-pro-preview';
    });

    const [inputValue, setInputValue] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isReactLoading, setIsReactLoading] = useState<boolean>(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);

    const [selectorMode, setSelectorMode] = useState<'edit' | 'extract' | false>(false);
    const [isDesignSystemMode, setIsDesignSystemMode] = useState<boolean>(false);
    const [snippetTab, setSnippetTab] = useState<'html' | 'react'>('html');
    const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
    const [isArtifactFullscreen, setIsArtifactFullscreen] = useState<boolean>(false);

    const [isPromptPopupOpen, setIsPromptPopupOpen] = useState<boolean>(false);

    // Bar position and visibility state
    const [barPosition, setBarPosition] = useState<BarPosition>(() => {
        const saved = localStorage.getItem('flash_ui_bar_position');
        return (saved === 'left' || saved === 'right' || saved === 'bottom') ? saved : 'bottom';
    });
    const [isBarHidden, setIsBarHidden] = useState<boolean>(() => {
        const saved = localStorage.getItem('flash_ui_bar_hidden');
        return saved === 'true';
    });
    const [areActionsVisible, setAreActionsVisible] = useState<boolean>(true);

    const [drawerState, setDrawerState] = useState<{
        isOpen: boolean;
        mode: 'code' | 'variations' | 'react' | 'snippet' | 'agent-prompt' | 'library' | 'import' | null;
        title: string;
        data: string;
        reactData?: string;
        artifactName?: string;
    }>({ isOpen: false, mode: null, title: '', data: '' });

    const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);

    // Element Editor state
    const [editingElement, setEditingElement] = useState<ElementData | null>(null);
    const [isElementEditorOpen, setIsElementEditorOpen] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const gridScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('flash_ui_creative_library');
        if (saved) {
            try { setStoredItems(JSON.parse(saved)); } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('flash_ui_creative_library', JSON.stringify(storedItems));
    }, [storedItems]);

    useEffect(() => {
        localStorage.setItem('flash_ui_concurrent_generations', concurrentGenerations.toString());
    }, [concurrentGenerations]);

    // Persist provider to localStorage (D13)
    useEffect(() => {
        localStorage.setItem('flash_ui_provider', provider);
    }, [provider]);

    // Reset model selections when provider changes (D14)
    useEffect(() => {
        const defaultModel = getDefaultModel(provider, false);
        const defaultDesignModel = getDefaultModel(provider, true);
        if (defaultModel) {
            setComponentModel(defaultModel.id);
        }
        if (defaultDesignModel) {
            setDesignSystemModel(defaultDesignModel.id);
        }
    }, [provider]);

    useEffect(() => {
        localStorage.setItem('flash_ui_component_model', componentModel);
    }, [componentModel]);

    useEffect(() => {
        localStorage.setItem('flash_ui_design_system_model', designSystemModel);
    }, [designSystemModel]);

    // Persist bar position and visibility
    useEffect(() => {
        localStorage.setItem('flash_ui_bar_position', barPosition);
    }, [barPosition]);

    useEffect(() => {
        localStorage.setItem('flash_ui_bar_hidden', isBarHidden.toString());
    }, [isBarHidden]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleIframeMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'ELEMENT_SELECTED') {
                const { elementData, outerHTML, styleContext } = event.data;

                // Check which mode we're in
                if (selectorMode === 'edit' && elementData) {
                    // Edit mode - open the Element Editor
                    setEditingElement(elementData);
                    setIsElementEditorOpen(true);
                } else if (selectorMode === 'extract') {
                    // Extract mode - extract as isolated snippet
                    handleExtractSnippet(outerHTML, styleContext);
                }
            }
        };
        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, [focusedArtifactIndex, currentSessionIndex, sessions, selectorMode]);

    const handleExtractSnippet = useCallback(async (snippetHtml: string, context: string) => {
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession || focusedArtifactIndex === null) return;
        const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

        setIsLoading(true);
        setSelectorMode(false);
        setSnippetTab('html');
        setDrawerState({ isOpen: true, mode: 'snippet', title: 'Isolated Component', data: '', reactData: '' });

        try {
            const stream = streamSnippetExtraction({
                provider: provider,
                snippetHtml,
                documentHtml: currentArtifact.html,
            });

            let accumulated = '';
            for await (const chunk of stream) {
                accumulated += chunk;
                const clean = cleanCodeFences(accumulated);
                setDrawerState(prev => ({ ...prev, data: clean }));
            }
        } catch (e: any) {
            setDrawerState(prev => ({ ...prev, data: `Error: ${e.message}` }));
        } finally {
            setIsLoading(false);
        }
    }, [sessions, currentSessionIndex, focusedArtifactIndex, provider]);

    const handlePortSnippetToReact = useCallback(async () => {
        if (drawerState.reactData || isReactLoading) return;

        setIsReactLoading(true);
        try {
            const stream = streamSnippetToReact({
                provider: provider,
                snippetHtml: drawerState.data,
                modelId: componentModel,
            });

            let accumulated = '';
            for await (const chunk of stream) {
                accumulated += chunk;
                const clean = cleanCodeFences(accumulated);
                setDrawerState(prev => ({ ...prev, reactData: clean }));
            }
        } catch (e: any) {
            setDrawerState(prev => ({ ...prev, reactData: `// Error: ${e.message}` }));
        } finally {
            setIsReactLoading(false);
        }
    }, [drawerState.data, drawerState.reactData, isReactLoading, componentModel, provider]);

    useEffect(() => {
        if (snippetTab === 'react' && drawerState.mode === 'snippet' && !drawerState.reactData) {
            handlePortSnippetToReact();
        }
    }, [snippetTab, drawerState.mode, drawerState.reactData, handlePortSnippetToReact]);

    const handleGenerateVariations = useCallback(async () => {
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession || focusedArtifactIndex === null) return;
        const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

        setIsLoading(true);
        setComponentVariations([]);
        setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentArtifact.id });

        try {
            const stream = streamVariations({
                provider: provider,
                prompt: currentSession.prompt,
            });

            let buffer = '';
            for await (const chunk of stream) {
                buffer += chunk;
                let braceCount = 0;
                let start = buffer.indexOf('{');
                while (start !== -1) {
                    braceCount = 0;
                    let end = -1;
                    for (let i = start; i < buffer.length; i++) {
                        if (buffer[i] === '{') braceCount++;
                        else if (buffer[i] === '}') braceCount--;
                        if (braceCount === 0 && i > start) {
                            end = i;
                            break;
                        }
                    }
                    if (end !== -1) {
                        const jsonString = buffer.substring(start, end + 1);
                        try {
                            const variation = JSON.parse(jsonString);
                            if (variation.name && variation.html) {
                                setComponentVariations(prev => [...prev, variation]);
                            }
                            buffer = buffer.substring(end + 1);
                            start = buffer.indexOf('{');
                        } catch (e) {
                            start = buffer.indexOf('{', start + 1);
                        }
                    } else {
                        break;
                    }
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [sessions, currentSessionIndex, focusedArtifactIndex, provider]);

    const handlePortToReact = useCallback(async () => {
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession || focusedArtifactIndex === null) return;
        const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

        setIsLoading(true);
        setDrawerState({ isOpen: true, mode: 'react', title: 'React Component', data: '' });

        try {
            const stream = streamReactComponent({
                provider: provider,
                html: currentArtifact.html,
                modelId: componentModel,
            });

            let accumulated = '';
            for await (const chunk of stream) {
                accumulated += chunk;
                const clean = cleanCodeFences(accumulated);
                setDrawerState(prev => ({ ...prev, data: clean }));
            }
        } finally {
            setIsLoading(false);
        }
    }, [sessions, currentSessionIndex, focusedArtifactIndex, componentModel, provider]);

    const handleDownload = useCallback((content: string) => {
        if (!content) return;
        const isReact = drawerState.mode === 'react' || (drawerState.mode === 'snippet' && snippetTab === 'react');
        const isPrompt = drawerState.mode === 'agent-prompt';
        const ext = isReact ? '.tsx' : isPrompt ? '.txt' : '.html';
        
        const baseName = drawerState.artifactName 
            ? slugifyName(drawerState.artifactName) 
            : 'flash-ui-export';
        const filename = `${baseName}${ext}`;

        const mimeType = isReact ? 'text/typescript' : isPrompt ? 'text/plain' : 'text/html';
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [drawerState.mode, drawerState.artifactName, snippetTab]);

    const copyToClipboard = useCallback(async (text: string) => {
        if (!text) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }, []);

    const applyVariation = (html: string) => {
        if (focusedArtifactIndex === null) return;
        setSessions(prev => prev.map((sess, i) =>
            i === currentSessionIndex ? {
                ...sess,
                artifacts: sess.artifacts.map((art, j) =>
                    j === focusedArtifactIndex ? { ...art, html, status: 'complete' } : art
                )
            } : sess
        ));
        setDrawerState(s => ({ ...s, isOpen: false }));
    };

    const handleShowCode = () => {
        const currentSession = sessions[currentSessionIndex];
        if (currentSession && focusedArtifactIndex !== null) {
            const artifact = currentSession.artifacts[focusedArtifactIndex];
            setDrawerState({ 
                isOpen: true, 
                mode: 'code', 
                title: 'Source Code', 
                data: artifact.html,
                artifactName: artifact.displayName || artifact.styleName
            });
        }
    };

    const handleShowAgentPrompt = () => {
        const currentSession = sessions[currentSessionIndex];
        if (currentSession && focusedArtifactIndex !== null) {
            const artifact = currentSession.artifacts[focusedArtifactIndex];
            setDrawerState({
                isOpen: true,
                mode: 'agent-prompt',
                title: 'Agent Logic',
                data: artifact.agentPrompt || 'Instruction metadata not available.',
                artifactName: artifact.displayName || artifact.styleName
            });
        }
    };

    const handleSaveToLibrary = () => {
        const currentSession = sessions[currentSessionIndex];
        if (currentSession && focusedArtifactIndex !== null) {
            const artifact = currentSession.artifacts[focusedArtifactIndex];
            const newItem: LibraryItem = {
                id: generateId(),
                name: artifact.styleName || 'Untitled Item',
                prompt: currentSession.prompt,
                html: artifact.html,
                type: artifact.isDesignSystem ? 'design-system' : 'component',
                timestamp: Date.now()
            };
            setStoredItems(prev => [newItem, ...prev]);
            alert(`Saved ${newItem.type === 'design-system' ? 'Design System' : 'Component'} to Library!`);
        }
    };

    const handleShowLibrary = () => {
        setDrawerState({
            isOpen: true,
            mode: 'library',
            title: 'Creative Library',
            data: ''
        });
    };

    const handleShowImport = () => {
        setDrawerState({
            isOpen: true,
            mode: 'import',
            title: 'Import Design',
            data: ''
        });
    };

    const handleImportDesign = useCallback((data: ImportedDesignData, displayName: string, type: 'design-system' | 'component') => {
        const sessionId = generateId();
        const artifact = createArtifactFromImport(data, displayName, type === 'design-system', sessionId);
        const libraryItem = createLibraryItemFromImport(data, displayName, type);

        const newSession: Session = {
            id: sessionId,
            prompt: `Imported: ${displayName}`,
            timestamp: Date.now(),
            artifacts: [artifact]
        };

        setSessions(prev => [...prev, newSession]);
        setCurrentSessionIndex(sessions.length);
        setFocusedArtifactIndex(0);
        setStoredItems(prev => [libraryItem, ...prev]);
        setDrawerState(s => ({ ...s, isOpen: false }));
    }, [sessions.length]);

    const toggleSystemContext = (item: LibraryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeSystem?.id === item.id) {
            setActiveSystem(null);
        } else {
            setActiveSystem(item);
            alert(`Active Context: ${item.name}. New components will follow this brand.`);
            setDrawerState(s => ({ ...s, isOpen: false }));
        }
    };

    const deleteFromLibrary = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setStoredItems(prev => prev.filter(s => s.id !== id));
        if (activeSystem?.id === id) setActiveSystem(null);
    };

    const loadFromLibrary = (item: LibraryItem) => {
        const sessionId = generateId();
        const artifact: Artifact = {
            id: `${sessionId}_0`,
            styleName: item.name,
            html: item.html,
            status: 'complete',
            isDesignSystem: item.type === 'design-system'
        };

        const newSession: Session = {
            id: sessionId,
            prompt: item.prompt,
            timestamp: Date.now(),
            artifacts: [artifact]
        };

        setSessions(prev => [...prev, newSession]);
        setCurrentSessionIndex(sessions.length);
        setFocusedArtifactIndex(0);
        setDrawerState(s => ({ ...s, isOpen: false }));
    };

    // Apply changes from the element editor to the iframe
    const applyElementChanges = useCallback((changes: Partial<ElementData['computedStyles']> & { textContent?: string; href?: string }) => {
        if (!editingElement) return;

        // Get the focused artifact's iframe
        const iframes = document.querySelectorAll('.artifact-card.focused iframe');
        if (iframes.length === 0) return;

        const iframe = iframes[0] as HTMLIFrameElement;
        if (!iframe.contentWindow) return;

        // Separate text/href from styles
        const { textContent, href, ...styles } = changes;

        // Send message to iframe to apply the change
        iframe.contentWindow.postMessage({
            type: 'APPLY_STYLE',
            path: editingElement.path,
            styles: Object.keys(styles).length > 0 ? styles : undefined,
            textContent,
            href
        }, '*');
    }, [editingElement]);

    // Save element edits by extracting updated HTML from iframe
    const saveElementEdits = useCallback(() => {
        if (focusedArtifactIndex === null || !currentSessionIndex) return;

        // Get the focused artifact's iframe
        const iframes = document.querySelectorAll('.artifact-card.focused iframe');
        if (iframes.length === 0) return;

        const iframe = iframes[0] as HTMLIFrameElement;
        if (!iframe.contentDocument) return;

        // Extract the full HTML from the iframe
        const updatedHtml = iframe.contentDocument.documentElement.outerHTML;

        // Update the artifact HTML in state
        setSessions(prev => prev.map((sess, sIdx) =>
            sIdx === currentSessionIndex ? {
                ...sess,
                artifacts: sess.artifacts.map((art, aIdx) =>
                    aIdx === focusedArtifactIndex ? { ...art, html: updatedHtml } : art
                )
            } : sess
        ));

        // Exit selector mode after saving
        setSelectorMode(false);
        setIsElementEditorOpen(false);
        setEditingElement(null);
    }, [focusedArtifactIndex, currentSessionIndex]);

    // Add handleInputChange to resolve the missing name error
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { value, scrollHeight, clientHeight } = e.target;
        setInputValue(value);

        if (!isPromptPopupOpen && scrollHeight > clientHeight + 4) {
            setIsPromptPopupOpen(true);
        }
    }, [isPromptPopupOpen]);

    const handleSendMessage = useCallback(async (manualPrompt?: string) => {
        const promptToUse = manualPrompt || inputValue;
        const trimmedInput = promptToUse.trim();
        if (!trimmedInput || isLoading) return;
        if (!manualPrompt) setInputValue('');

        setIsLoading(true);
        const sessionId = generateId();
        const placeholderArtifacts: Artifact[] = Array(concurrentGenerations).fill(null).map((_, i) => ({
            id: `${sessionId}_${i}`,
            styleName: 'Designing...',
            html: '',
            status: 'streaming',
            isDesignSystem: isDesignSystemMode
        }));

        const newSession: Session = {
            id: sessionId,
            prompt: trimmedInput,
            timestamp: Date.now(),
            artifacts: placeholderArtifacts
        };

        setSessions(prev => [...prev, newSession]);
        setCurrentSessionIndex(sessions.length);
        setFocusedArtifactIndex(null);

        try {
            // Generate style directions using the facade
            const generatedStyles = await generateStyles({
                provider: provider,
                prompt: trimmedInput,
                isDesignSystemMode,
            });

            setSessions(prev => prev.map(s => s.id === sessionId ? {
                ...s, artifacts: s.artifacts.map((art, i) => ({ ...art, styleName: generatedStyles[i] || `Direction ${i + 1}` }))
            } : s));

            const systemInstructions = isDesignSystemMode
                ? `You are a Lead Design Systems Architect. Create a FULL DESIGN SYSTEM style guide and component library for: "${trimmedInput}".`
                : activeSystem
                    ? `You are a frontend developer. Create a UI component for: "${trimmedInput}". 
                   CRITICAL: You MUST adhere to the following Design System tokens and CSS variables to ensure brand consistency:
                   ${activeSystem.html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || "No style context found. Use professional standards."}
                   Ensure the component looks like it belongs to this brand and uses the provided variables (colors, spacing, typography).`
                    : `Create a stunning high-fidelity UI component for: "${trimmedInput}".`;

            const generateArtifact = async (artifact: Artifact, style: string) => {
                const finalPrompt = systemInstructions + `\n\nDirection: ${style}. Return RAW HTML only.`;

                setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                    ...sess, artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, agentPrompt: finalPrompt } : art)
                } : sess));

                const stream = streamHtmlArtifact({
                    provider: provider,
                    prompt: finalPrompt,
                    modelId: isDesignSystemMode ? designSystemModel : componentModel,
                    useThinking: isDesignSystemMode,
                });

                let accumulated = '';
                for await (const chunk of stream) {
                    accumulated += chunk;
                    setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                        ...sess, artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, html: accumulated } : art)
                    } : sess));
                }
                const final = cleanCodeFences(accumulated);
                setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                    ...sess, artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, html: final, status: 'complete' } : art)
                } : sess));
            };

            await Promise.all(placeholderArtifacts.map((art, i) => generateArtifact(art, generatedStyles[i])));
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, sessions.length, isDesignSystemMode, activeSystem, concurrentGenerations, designSystemModel, componentModel, provider]);

    const handleSurpriseMe = () => {
        const p = placeholders[placeholderIndex];
        setInputValue(p);
        handleSendMessage(p);
    };

    const nextItem = () => {
        const sess = sessions[currentSessionIndex];
        if (focusedArtifactIndex !== null && sess && focusedArtifactIndex < sess.artifacts.length - 1) setFocusedArtifactIndex(focusedArtifactIndex + 1);
        else if (currentSessionIndex < sessions.length - 1) { setCurrentSessionIndex(currentSessionIndex + 1); setFocusedArtifactIndex(null); }
    };

    const prevItem = () => {
        if (focusedArtifactIndex !== null && focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1);
        else if (currentSessionIndex > 0) { setCurrentSessionIndex(currentSessionIndex - 1); setFocusedArtifactIndex(null); }
    };

    const hasStarted = sessions.length > 0 || isLoading;
    const isGlmLoading = isLoading && provider === 'glm';
    const currentSession = sessions[currentSessionIndex];
    const canGoBack = (focusedArtifactIndex !== null && focusedArtifactIndex > 0) || currentSessionIndex > 0;
    const canGoForward = (focusedArtifactIndex !== null && currentSession && focusedArtifactIndex < currentSession.artifacts.length - 1) || currentSessionIndex < sessions.length - 1;

    const currentSnippetData = drawerState.mode === 'snippet' && snippetTab === 'react' ? (drawerState.reactData || '') : (drawerState.data || '');

    return (
        <>
            <ElementEditor
                element={editingElement}
                isOpen={isElementEditorOpen}
                onClose={() => {
                    setIsElementEditorOpen(false);
                    setEditingElement(null);
                }}
                onApplyChanges={applyElementChanges}
                onSave={saveElementEdits}
            />
            <SideDrawer isOpen={drawerState.isOpen} onClose={() => setDrawerState(s => ({ ...s, isOpen: false }))} title={drawerState.title}>
                {((isLoading && drawerState.mode === 'react' && !drawerState.data) || (isReactLoading && snippetTab === 'react' && !drawerState.reactData) || (isLoading && drawerState.mode === 'snippet' && !drawerState.data)) && (
                    <div className="react-loading-state">
                        <div className="react-loading-icon"><ReactIcon /></div>
                        <div className="react-loading-text">
                            <span className="loading-title">{drawerState.mode === 'react' ? 'Converting to React...' : isReactLoading ? 'Converting...' : 'Extracting...'}</span>
                            <span className="loading-subtitle">Generating production-ready code</span>
                        </div>
                        <div className="loading-shimmer-bar" />
                    </div>
                )}
                {drawerState.mode === 'snippet' && (
                    <div className="snippet-tabs">
                        <button className={`tab-btn ${snippetTab === 'html' ? 'active' : ''}`} onClick={() => setSnippetTab('html')}><CodeIcon /> HTML</button>
                        <button className={`tab-btn ${snippetTab === 'react' ? 'active' : ''}`} onClick={() => setSnippetTab('react')}><ReactIcon /> React</button>
                    </div>
                )}
                {(drawerState.mode === 'code' || drawerState.mode === 'react' || drawerState.mode === 'snippet' || drawerState.mode === 'agent-prompt') && (
                    <div className="code-container">
                        <div className="drawer-actions">
                            <button className="copy-code-button" onClick={() => copyToClipboard(currentSnippetData)}><CopyIcon /> {copyFeedback ? 'Copied!' : 'Copy'}</button>
                            {drawerState.mode !== 'agent-prompt' && <button className="copy-code-button" onClick={() => handleDownload(currentSnippetData)}><DownloadIcon /> Download</button>}
                        </div>
                        {(isLoading && drawerState.mode === 'react' && !drawerState.data) || (isReactLoading && snippetTab === 'react' && !drawerState.reactData) ? (
                            <div className="code-skeleton">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="skeleton-line" style={{ width: `${40 + Math.random() * 55}%`, animationDelay: `${i * 0.05}s` }} />
                                ))}
                            </div>
                        ) : (
                            <pre className={`code-block ${(isLoading || isReactLoading) && currentSnippetData ? 'streaming' : ''}`}>
                                <code>{currentSnippetData}</code>
                                {(isLoading || isReactLoading) && currentSnippetData && <span className="streaming-cursor" />}
                            </pre>
                        )}
                    </div>
                )}
                {drawerState.mode === 'variations' && (
                    <div className="sexy-grid">
                        {componentVariations.map((v, i) => (
                            <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
                                <div className="sexy-preview"><iframe srcDoc={v.html} title={v.name} sandbox="allow-scripts allow-same-origin" /></div>
                                <div className="sexy-label">{v.name}</div>
                            </div>
                        ))}
                    </div>
                )}
                {drawerState.mode === 'library' && (
                    <div className="library-list">
                        {storedItems.length === 0 ? <div className="empty-library">Your library is empty.</div> : (
                            storedItems.map(item => (
                                <div key={item.id} className="library-item" onClick={() => loadFromLibrary(item)}>
                                    <div className="library-item-info">
                                        <div className="library-item-header">
                                            <div className="library-item-name">{item.name}</div>
                                            <span className={`item-type-badge ${item.type}`}>{item.type === 'design-system' ? 'DS' : 'CMP'}</span>
                                        </div>
                                        <div className="library-item-prompt">{item.prompt}</div>
                                    </div>
                                    <div className="library-item-actions">
                                        {item.type === 'design-system' && (
                                            <button
                                                className={`context-btn ${activeSystem?.id === item.id ? 'active' : ''}`}
                                                title={activeSystem?.id === item.id ? "System Active" : "Activate System Context"}
                                                onClick={(e) => toggleSystemContext(item, e)}
                                            >
                                                <PaletteIcon />
                                            </button>
                                        )}
                                        <button className="delete-item-btn" onClick={(e) => deleteFromLibrary(item.id, e)}><TrashIcon /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {drawerState.mode === 'import' && (
                    <ImportDesignPanel
                        onImport={handleImportDesign}
                        onCancel={() => setDrawerState(s => ({ ...s, isOpen: false }))}
                    />
                )}
            </SideDrawer>

            <div className={`immersive-app ${isArtifactFullscreen ? 'fullscreen-artifact' : ''}`}>
                <DottedGlowBackground gap={24} radius={1.5} color="rgba(255, 255, 255, 0.02)" glowColor="rgba(255, 255, 255, 0.15)" speedScale={0.5} />
                <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                    <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
                        <div className="empty-content">
                            <h1>Flash UI</h1>
                            <p>Creative UI generation in a flash</p>
                            <div className="empty-actions">
                                <button className={`mode-toggle ${isDesignSystemMode ? 'active' : ''}`} onClick={() => setIsDesignSystemMode(!isDesignSystemMode)}><PaletteIcon /> {isDesignSystemMode ? 'Design System Mode' : 'Component Mode'}</button>
                                <button className="surprise-button" onClick={handleSurpriseMe} disabled={isLoading}><SparklesIcon /> Surprise Me</button>
                            </div>
                        </div>
                    </div>
                    {isGlmLoading && (
                        <GlmLoadingIndicator />
                    )}
                    {sessions.map((session, sIndex) => (
                        <div key={session.id} className={`session-group ${sIndex === currentSessionIndex ? 'active-session' : sIndex < currentSessionIndex ? 'past-session' : 'future-session'}`}>
                            <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                {session.artifacts.map((artifact, aIndex) => (
                                    <ArtifactCard key={artifact.id} artifact={artifact} isFocused={focusedArtifactIndex === aIndex} isSelectorMode={!!selectorMode && focusedArtifactIndex === aIndex} onClick={() => setFocusedArtifactIndex(aIndex)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {canGoBack && <button className="nav-handle left" onClick={prevItem}><ArrowLeftIcon /></button>}
                {canGoForward && <button className="nav-handle right" onClick={nextItem}><ArrowRightIcon /></button>}
                <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                    <button 
                        className="action-bar-toggle" 
                        onClick={() => setAreActionsVisible(!areActionsVisible)}
                        aria-label={areActionsVisible ? 'Hide action buttons' : 'Show action buttons'}
                        aria-expanded={areActionsVisible}
                        title={areActionsVisible ? 'Hide buttons' : 'Show buttons'}
                    >
                        {areActionsVisible ? <ChevronDownIcon /> : <ChevronUpIcon />}
                    </button>
                    <div className={`action-buttons ${areActionsVisible ? '' : 'hidden'}`}>
                        <button onClick={() => { setFocusedArtifactIndex(null); setSelectorMode(false); }}><GridIcon /> Grid View</button>
                        {focusedArtifactIndex !== null && (
                            <button
                                onClick={() => setIsArtifactFullscreen(prev => !prev)}
                                aria-pressed={isArtifactFullscreen}
                            >
                                {isArtifactFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            </button>
                        )}
                        <button onClick={() => setSelectorMode(selectorMode === 'edit' ? false : 'edit')} className={selectorMode === 'edit' ? 'active-btn' : ''}><SelectorIcon /> {selectorMode === 'edit' ? 'Cancel Edit' : 'Edit Element'}</button>
                        <button onClick={() => setSelectorMode(selectorMode === 'extract' ? false : 'extract')} className={selectorMode === 'extract' ? 'active-btn' : ''}><CodeIcon /> {selectorMode === 'extract' ? 'Cancel Extract' : 'Extract'}</button>
                        <button onClick={handleGenerateVariations} disabled={isLoading}><SparklesIcon /> Variations</button>
                        <button onClick={handlePortToReact} disabled={isLoading}><ReactIcon /> Port to React</button>
                        <button onClick={handleSaveToLibrary} title="Archive to Library"><SaveIcon /> Store</button>
                        <button onClick={handleShowAgentPrompt}><BrainIcon /> Agent Logic</button>
                        <button onClick={handleShowCode}><CodeIcon /> HTML/CSS</button>
                    </div>
                    {selectorMode && <div className="selector-tip">{selectorMode === 'edit' ? 'Click any element to edit its styles.' : 'Click any element to extract it as a component.'}</div>}
                </div>
                {!isBarHidden && (
                <div className={`floating-input-container bar-position-${barPosition}`}>
                    {activeSystem && (
                        <div className="active-context-badge" onClick={() => setActiveSystem(null)}>
                            🎯 Brand: <strong>{activeSystem.name}</strong> <span className="clear-ctx">&times;</span>
                        </div>
                    )}
                    <div className={`input-wrapper ${isLoading ? 'loading' : ''} ${isDesignSystemMode ? 'design-system-active' : ''}`}>
                        <button 
                            className="mini-mode-toggle pin-control-btn" 
                            title="Bar Position" 
                            onClick={() => {
                                const positions: BarPosition[] = ['bottom', 'left', 'right'];
                                const currentIndex = positions.indexOf(barPosition);
                                const nextIndex = (currentIndex + 1) % positions.length;
                                setBarPosition(positions[nextIndex]);
                            }}
                            aria-label={`Change bar position (current: ${barPosition})`}
                        >
                            {barPosition === 'bottom' && <PinBottomIcon />}
                            {barPosition === 'left' && <PinLeftIcon />}
                            {barPosition === 'right' && <PinRightIcon />}
                        </button>
                        <button 
                            className="mini-mode-toggle" 
                            title="Hide Bar" 
                            onClick={() => setIsBarHidden(true)}
                            aria-label="Hide prompt bar"
                        >
                            <EyeOffIcon />
                        </button>
                        <button className={`mini-mode-toggle ${isDesignSystemMode ? 'active' : ''}`} title="Design System Mode" onClick={() => setIsDesignSystemMode(!isDesignSystemMode)}><PaletteIcon /></button>
                        <button className="mini-mode-toggle" title="My Creative Library" onClick={handleShowLibrary}><LibraryIcon /></button>
                        <button className="mini-mode-toggle" title="Import HTML Design" onClick={handleShowImport}><UploadIcon /></button>
                        <div className="provider-select-control" title="AI Provider">
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value as ProviderId)}
                                className="provider-select"
                                disabled={isLoading}
                            >
                                <option value="gemini">Gemini</option>
                                <option value="glm">GLM</option>
                                <option value="openrouter">OpenRouter</option>
                            </select>
                        </div>
                        <div className="generation-count-control" title="Number of concurrent generations">
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={concurrentGenerations}
                                onChange={(e) => setConcurrentGenerations(parseInt(e.target.value, 10))}
                                className="generation-slider"
                                disabled={isLoading}
                            />
                            <span className="generation-count-label">{concurrentGenerations}</span>
                        </div>
                        <div className="model-select-control" title={`Model for ${isDesignSystemMode ? 'Design System' : 'Component'} mode`}>
                            <select
                                value={isDesignSystemMode ? designSystemModel : componentModel}
                                onChange={(e) => {
                                    const value = e.target.value as ModelId;
                                    if (isDesignSystemMode) {
                                        setDesignSystemModel(value);
                                    } else {
                                        setComponentModel(value);
                                    }
                                }}
                                className="model-select"
                                disabled={isLoading}
                            >
                                {availableModels.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>
                        {!isLoading ? (
                            <button 
                                className="open-popup-button" 
                                onClick={() => setIsPromptPopupOpen(true)}
                                disabled={isLoading}
                                aria-label="Open prompt editor"
                                title="Write prompt"
                            >
                                <EditIcon />
                                {barPosition === 'bottom' && <span className="popup-button-label">Write Prompt</span>}
                            </button>
                        ) : (
                            <div className="input-generating-label" aria-label="Generating"><ThinkingIcon /></div>
                        )}
                    </div>
                </div>
                )}
                {isBarHidden && (
                <button 
                    className={`bar-reveal-handle bar-position-${barPosition}`}
                    onClick={() => setIsBarHidden(false)}
                    aria-label="Show prompt bar"
                    title="Show prompt bar"
                >
                    <EyeIcon />
                </button>
                )}
                <PromptPopup
                    isOpen={isPromptPopupOpen}
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={() => {
                        handleSendMessage();
                        setIsPromptPopupOpen(false);
                    }}
                    onClose={() => setIsPromptPopupOpen(false)}
                    isLoading={isLoading}
                    placeholder={isDesignSystemMode ? 'Describe brand architecture...' : 'Describe a UI component...'}
                />
            </div>
        </>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
