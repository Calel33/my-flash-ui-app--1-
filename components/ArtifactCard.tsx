
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

                    function getElementPath(el) {
                        const path = [];
                        while (el && el !== document.body) {
                            const parent = el.parentElement;
                            if (parent) {
                                const siblings = Array.from(parent.children);
                                path.unshift(siblings.indexOf(el));
                            }
                            el = parent;
                        }
                        return path;
                    }

                    function getElementData(el) {
                        const computed = getComputedStyle(el);
                        return {
                            tagName: el.tagName,
                            id: el.id || '',
                            className: el.className || '',
                            textContent: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent?.trim() : '',
                            href: el.getAttribute('href') || '',
                            computedStyles: {
                                marginTop: computed.marginTop,
                                marginRight: computed.marginRight,
                                marginBottom: computed.marginBottom,
                                marginLeft: computed.marginLeft,
                                paddingTop: computed.paddingTop,
                                paddingRight: computed.paddingRight,
                                paddingBottom: computed.paddingBottom,
                                paddingLeft: computed.paddingLeft,
                                backgroundColor: computed.backgroundColor,
                                color: computed.color,
                                fontSize: computed.fontSize,
                                fontFamily: computed.fontFamily,
                                fontWeight: computed.fontWeight,
                                lineHeight: computed.lineHeight,
                                letterSpacing: computed.letterSpacing,
                                textAlign: computed.textAlign,
                                borderRadius: computed.borderRadius,
                                borderWidth: computed.borderWidth,
                                borderColor: computed.borderColor,
                                width: computed.width,
                                height: computed.height,
                                display: computed.display,
                                position: computed.position,
                                gap: computed.gap,
                                justifyContent: computed.justifyContent,
                                alignItems: computed.alignItems,
                                boxShadow: computed.boxShadow,
                                opacity: computed.opacity,
                                transform: computed.transform
                            },
                            path: getElementPath(el)
                        };
                    }

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
                                elementData: getElementData(lastEl),
                                outerHTML: lastEl.outerHTML,
                                styleContext: document.querySelector('style')?.innerText || ''
                            }, '*');
                        }
                    }, true);

                    // Listen for style updates from parent
                    window.addEventListener('message', (e) => {
                        if (e.data?.type === 'APPLY_STYLE') {
                            const { path, styles, textContent, href } = e.data;
                            let el = document.body;
                            for (const idx of path) {
                                el = el.children[idx];
                                if (!el) return;
                            }
                            if (styles) {
                                Object.assign(el.style, styles);
                            }
                            if (textContent !== undefined && el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                                el.textContent = textContent;
                            }
                            if (href !== undefined && el.tagName === 'A') {
                                el.setAttribute('href', href);
                            }
                        }
                    });

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
