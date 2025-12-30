
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { Session } from './types';

import { usePreferences } from './hooks/usePreferences';
import { useLibrary } from './hooks/useLibrary';
import { useDrawer } from './hooks/useDrawer';
import { useVariations } from './hooks/useVariations';
import { useArtifactGeneration } from './hooks/useArtifactGeneration';
import { useElementEditor } from './hooks/useElementEditor';
import { useSnippetConversion } from './hooks/useSnippetConversion';
import { useIframeSelection } from './hooks/useIframeSelection';
import { useSessionNavigation } from './hooks/useSessionNavigation';
import { useDrawerActions } from './hooks/useDrawerActions';
import { useSessionMutations } from './hooks/useSessionMutations';
import { useDrawerOpeners } from './hooks/useDrawerOpeners';
import { useSurpriseMe } from './hooks/useSurpriseMe';

import GlmLoadingIndicator from './components/GlmLoadingIndicator';
import SideDrawer from './components/SideDrawer';
import ElementEditor, { ElementData } from './components/ElementEditor';
import AppShell from './components/AppShell';
import EmptyState from './components/EmptyState';
import SessionGrid from './components/SessionGrid';
import ActionBar from './components/ActionBar';
import PromptBar from './components/PromptBar';
import DrawerContent from './components/DrawerContent';

export function App() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
    const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
    const prevSessionsLength = useRef<number>(0);
    const {
        activeSystem,
        clearActiveSystem,
        deleteItem: deleteLibraryItem,
        prependItem: prependLibraryItem,
        storedItems,
        toggleActiveSystem,
    } = useLibrary();
    const {
        availableModels,
        barPosition,
        componentModel,
        concurrentGenerations,
        designSystemModel,
        isBarHidden,
        provider,
        setBarPosition,
        setComponentModel,
        setConcurrentGenerations,
        setDesignSystemModel,
        setIsBarHidden,
        setProvider,
    } = usePreferences();

    const [inputValue, setInputValue] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isReactLoading, setIsReactLoading] = useState<boolean>(false);

    const [selectorMode, setSelectorMode] = useState<'edit' | 'extract' | false>(false);
    const [isDesignSystemMode, setIsDesignSystemMode] = useState<boolean>(false);
    const [snippetTab, setSnippetTab] = useState<'html' | 'react'>('html');
    const [isArtifactFullscreen, setIsArtifactFullscreen] = useState<boolean>(false);

    const [isPromptPopupOpen, setIsPromptPopupOpen] = useState<boolean>(false);

    const [areActionsVisible, setAreActionsVisible] = useState<boolean>(true);

    const { closeDrawer, drawerState, openDrawer, setDrawerState } = useDrawer();
    const { handleSendMessage } = useArtifactGeneration({
        inputValue,
        isLoading,
        isDesignSystemMode,
        activeSystem,
        concurrentGenerations,
        designSystemModel,
        componentModel,
        provider,
        setInputValue,
        setIsLoading,
        setSessions,
        setFocusedArtifactIndex,
    });
    const { componentVariations, handleGenerateVariations } = useVariations({
        sessions,
        currentSessionIndex,
        focusedArtifactIndex,
        provider,
        openDrawer,
        setIsLoading,
    });
    const { handleExtractSnippet, handlePortToReact } = useSnippetConversion({
        sessions,
        currentSessionIndex,
        focusedArtifactIndex,
        provider,
        componentModel,
        drawerState,
        openDrawer,
        setDrawerState,
        snippetTab,
        setSnippetTab,
        isReactLoading,
        setIsReactLoading,
        setIsLoading,
        setSelectorMode,
    });

    // Element Editor state
    const [editingElement, setEditingElement] = useState<ElementData | null>(null);
    const [isElementEditorOpen, setIsElementEditorOpen] = useState(false);

    useIframeSelection({
        selectorMode,
        setEditingElement,
        setIsElementEditorOpen,
        handleExtractSnippet,
    });

    const { canGoBack, canGoForward, hasStarted, isGlmLoading, nextItem, prevItem } = useSessionNavigation({
        sessions,
        currentSessionIndex,
        focusedArtifactIndex,
        isLoading,
        provider,
        setCurrentSessionIndex,
        setFocusedArtifactIndex,
    });

    useEffect(() => {
        if (sessions.length > prevSessionsLength.current) {
            setCurrentSessionIndex(sessions.length - 1);
        }
        prevSessionsLength.current = sessions.length;
    }, [sessions]);

    const gridScrollRef = useRef<HTMLDivElement>(null);

    const { copyFeedback, copyToClipboard, handleDownload } = useDrawerActions({
        drawerMode: drawerState.mode,
        artifactName: drawerState.artifactName,
        snippetTab,
    });

    const { applyVariation, deleteFromLibrary, handleImportDesign, handleSaveToLibrary, loadFromLibrary, toggleSystemContext } =
        useSessionMutations({
            sessions,
            currentSessionIndex,
            focusedArtifactIndex,
            setSessions,
            setFocusedArtifactIndex,
            prependLibraryItem,
            deleteLibraryItem,
            activeSystem,
            clearActiveSystem,
            toggleActiveSystem,
            closeDrawer,
        });

    const { handleShowAgentPrompt, handleShowCode, handleShowImport, handleShowLibrary } = useDrawerOpeners({
        sessions,
        currentSessionIndex,
        focusedArtifactIndex,
        openDrawer,
    });

    const { applyElementChanges, saveElementEdits } = useElementEditor({
        editingElement,
        focusedArtifactIndex,
        currentSessionIndex,
        setSessions,
        setSelectorMode,
        setIsElementEditorOpen,
        setEditingElement,
    });

    const { handleSurpriseMe } = useSurpriseMe({ setInputValue, handleSendMessage });

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
            <SideDrawer isOpen={drawerState.isOpen} onClose={closeDrawer} title={drawerState.title}>
                <DrawerContent
                    drawerState={drawerState}
                    isLoading={isLoading}
                    isReactLoading={isReactLoading}
                    snippetTab={snippetTab}
                    setSnippetTab={setSnippetTab}
                    currentSnippetData={currentSnippetData}
                    copyFeedback={copyFeedback}
                    copyToClipboard={copyToClipboard}
                    handleDownload={handleDownload}
                    componentVariations={componentVariations}
                    applyVariation={applyVariation}
                    storedItems={storedItems}
                    activeSystem={activeSystem}
                    loadFromLibrary={loadFromLibrary}
                    toggleSystemContext={toggleSystemContext}
                    deleteFromLibrary={deleteFromLibrary}
                    handleImportDesign={handleImportDesign}
                    closeDrawer={closeDrawer}
                />
            </SideDrawer>

            <AppShell isArtifactFullscreen={isArtifactFullscreen}>
                <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                    <EmptyState
                        hasStarted={hasStarted}
                        isDesignSystemMode={isDesignSystemMode}
                        isLoading={isLoading}
                        onToggleMode={() => setIsDesignSystemMode(!isDesignSystemMode)}
                        onSurpriseMe={handleSurpriseMe}
                    />
                    {isGlmLoading && (
                        <GlmLoadingIndicator />
                    )}
                    <SessionGrid
                        sessions={sessions}
                        currentSessionIndex={currentSessionIndex}
                        focusedArtifactIndex={focusedArtifactIndex}
                        selectorMode={selectorMode}
                        gridScrollRef={gridScrollRef}
                        onFocusArtifact={(artifactIndex) => setFocusedArtifactIndex(artifactIndex)}
                    />
                </div>
                <ActionBar
                    canGoBack={canGoBack}
                    canGoForward={canGoForward}
                    focusedArtifactIndex={focusedArtifactIndex}
                    isArtifactFullscreen={isArtifactFullscreen}
                    isLoading={isLoading}
                    areActionsVisible={areActionsVisible}
                    prevItem={prevItem}
                    nextItem={nextItem}
                    selectorMode={selectorMode}
                    setAreActionsVisible={setAreActionsVisible}
                    setFocusedArtifactIndex={setFocusedArtifactIndex}
                    setIsArtifactFullscreen={setIsArtifactFullscreen}
                    setSelectorMode={setSelectorMode}
                    handleGenerateVariations={handleGenerateVariations}
                    handlePortToReact={handlePortToReact}
                    handleSaveToLibrary={handleSaveToLibrary}
                    handleShowAgentPrompt={handleShowAgentPrompt}
                    handleShowCode={handleShowCode}
                />
                <PromptBar
                    activeSystem={activeSystem}
                    clearActiveSystem={clearActiveSystem}
                    availableModels={availableModels}
                    barPosition={barPosition}
                    setBarPosition={setBarPosition}
                    isBarHidden={isBarHidden}
                    setIsBarHidden={setIsBarHidden}
                    isDesignSystemMode={isDesignSystemMode}
                    setIsDesignSystemMode={setIsDesignSystemMode}
                    provider={provider}
                    setProvider={setProvider}
                    concurrentGenerations={concurrentGenerations}
                    setConcurrentGenerations={setConcurrentGenerations}
                    componentModel={componentModel}
                    setComponentModel={setComponentModel}
                    designSystemModel={designSystemModel}
                    setDesignSystemModel={setDesignSystemModel}
                    isLoading={isLoading}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    isPromptPopupOpen={isPromptPopupOpen}
                    setIsPromptPopupOpen={setIsPromptPopupOpen}
                    handleSendMessage={handleSendMessage}
                    handleShowLibrary={handleShowLibrary}
                    handleShowImport={handleShowImport}
                />
            </AppShell>
        </>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
