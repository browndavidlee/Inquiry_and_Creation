/* --- js/utils/linkParser.js (v28.2 - CORRECTED) --- */

/**
 * Parses a string for internal cross-links and replaces them with placeholder tokens,
 * returning the processed text and a map of tokens to link data.
 *
 * Syntax: [[type:identifier|display text]]
 * Example: "This links to [[node:N01|a specific node]]."
 *
 * @param {string} text The raw text content to parse.
 * @returns {{processedText: string, linkMap: Map<string, object>}} An object containing the processed text
 *          with placeholders and a map linking each placeholder to its structured data.
 */
export function parseInternalLinks(text) {
    if (typeof text !== 'string' || !text) {
        return { processedText: text || '', linkMap: new Map() };
    }

    const linkMap = new Map();
    // Regex to find all instances of [[type:identifier|optional text]]
    const linkRegex = /\[\[([a-z_]+):([^|\]]+)(?:\|([^\]]+))?\]\]/g;

    const processedText = text.replace(linkRegex, (match, type, identifier, displayText) => {
        // THIS IS THE CORRECTED LINE:
        const token = `__LINK_${linkMap.size}__`;

        linkMap.set(token, {
            type: type.trim(),
            identifier: identifier.trim(),
            displayText: displayText ? displayText.trim() : null, // If null, UI will fetch default name
        });

        return token;
    });

    return { processedText, linkMap };
}