
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Artifact {
  id: string;
  styleName: string;
  html: string;
  agentPrompt?: string;
  status: 'streaming' | 'complete' | 'error';
  isDesignSystem?: boolean;
}

export interface LibraryItem {
    id: string;
    name: string;
    prompt: string;
    html: string;
    type: 'design-system' | 'component';
    timestamp: number;
}

export interface Session {
    id: string;
    prompt: string;
    timestamp: number;
    artifacts: Artifact[];
}

export interface ComponentVariation { name: string; html: string; }
export interface LayoutOption { name: string; css: string; previewHtml: string; }
