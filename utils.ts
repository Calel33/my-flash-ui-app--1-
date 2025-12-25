/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Artifact, LibraryItem } from './types';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const slugifyName = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);
};

export const getFilenameWithoutExtension = (filename: string): string => {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
};

export interface ImportedDesignData {
    html: string;
    suggestedName: string;
    sourceFilename: string;
}

export const parseUploadedHtmlFile = (file: File): Promise<ImportedDesignData> => {
    return new Promise((resolve, reject) => {
        if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
            reject(new Error('Please upload an HTML file (.html or .htm)'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content || content.trim().length === 0) {
                reject(new Error('The uploaded file is empty'));
                return;
            }
            resolve({
                html: content,
                suggestedName: getFilenameWithoutExtension(file.name),
                sourceFilename: file.name
            });
        };
        reader.onerror = () => reject(new Error('Failed to read the file'));
        reader.readAsText(file);
    });
};

export const createArtifactFromImport = (
    data: ImportedDesignData,
    displayName: string,
    isDesignSystem: boolean,
    sessionId: string
): Artifact => {
    return {
        id: `${sessionId}_0`,
        styleName: displayName,
        html: data.html,
        status: 'complete',
        isDesignSystem,
        displayName,
        sourceFilename: data.sourceFilename
    };
};

export const createLibraryItemFromImport = (
    data: ImportedDesignData,
    displayName: string,
    type: 'design-system' | 'component'
): LibraryItem => {
    return {
        id: generateId(),
        name: displayName,
        prompt: `Imported from ${data.sourceFilename}`,
        html: data.html,
        type,
        timestamp: Date.now(),
        displayName,
        sourceFilename: data.sourceFilename
    };
};