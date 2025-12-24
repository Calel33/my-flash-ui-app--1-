
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useMemo } from 'react';
import { Artifact } from '../types';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    isSelectorMode?: boolean;
    onClick: () => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    isSelectorMode,
    onClick 
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Auto-scroll logic for this specific card
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    const isBlurring = artifact.status === 'streaming';

    // Inject selection script if mode is active
    const processedHtml = useMemo(() => {
        if (!isSelectorMode) return artifact.html;

        const selectorScript = `
            <script>
                (function() {
                    let lastEl = null;
                    const overlay = document.createElement('div');
                    overlay.style.position = 'fixed';
                    overlay.style.pointerEvents = 'none';
                    overlay.style.border = '2px solid #3b82f6';
                    overlay.style.background = 'rgba(59, 130, 246, 0.1)';
                    overlay.style.zIndex = '999999';
                    overlay.style.display = 'none';
                    overlay.style.transition = 'all 0.1s ease';
                    document.body.appendChild(overlay);

                    document.addEventListener('mousemove', (e) => {
                        const el = document.elementFromPoint(e.clientX, e.clientY);
                        if (el && el !== document.body && el !== document.documentElement && el !== overlay) {
                            lastEl = el;
                            const rect = el.getBoundingClientRect();
                            overlay.style.top = rect.top + 'px';
                            overlay.style.left = rect.left + 'px';
                            overlay.style.width = rect.width + 'px';
                            overlay.style.height = rect.height + 'px';
                            overlay.style.display = 'block';
                        } else {
                            overlay.style.display = 'none';
                        }
                    });

                    document.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (lastEl) {
                            window.parent.postMessage({
                                type: 'ELEMENT_SELECTED',
                                outerHTML: lastEl.outerHTML,
                                styleContext: document.querySelector('style')?.innerText || ''
                            }, '*');
                        }
                    }, true);

                    const style = document.createElement('style');
                    style.innerHTML = '* { cursor: crosshair !important; }';
                    document.head.appendChild(style);
                })();
            </script>
        `;
        return artifact.html + selectorScript;
    }, [artifact.html, isSelectorMode]);

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''} ${isSelectorMode ? 'selector-active' : ''}`}
            onClick={isSelectorMode ? undefined : onClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{artifact.styleName}</span>
            </div>
            <div className="artifact-card-inner">
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}
                <iframe 
                    ref={iframeRef}
                    srcDoc={processedHtml} 
                    title={artifact.id} 
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                    className="artifact-iframe"
                />
            </div>
        </div>
    );
});

export default ArtifactCard;
