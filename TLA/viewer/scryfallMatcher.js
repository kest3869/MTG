// This map will hold our 'cardName' -> 'scryfallObject' data
let scryfallMap = new Map();

/**
 * Loads the scryfall_data.json and builds the internal map.
 * This must be called once before getImageUrl() can be used.
 */
export async function init() {
    try {
        const scryfallData = await fetch('../scryfall_data.json').then(res => res.json());

        for (const card of scryfallData) {
            // Use robust regex split to get front face as key
            const frontFaceName = card.name.split(/\s*\/\/\s*/)[0];
            scryfallMap.set(frontFaceName, card);
        }
        console.log("Scryfall Matcher initialized.");
    } catch (error) {
        console.error("Failed to initialize Scryfall Matcher:", error);
    }
}

/**
 * Gets the Scryfall image URL for a given card name.
 * Handles DFCs and missing images.
 * @param {string} cardName - The card's name (e.g., "The Legend of Kyoshi // Avatar Kyoshi")
 * @returns {string} - The URL to the card's 'large' image.
 */
export function getImageUrl(cardName) {
    const placeholder = 'https://c1.scryfall.com/file/scryfall-card-backs/large.jpg';

    // Use the same robust split to find the card
    const frontFaceName = cardName.split(/\s*\/\/\s*/)[0];
    const scryfallCard = scryfallMap.get(frontFaceName);

    if (!scryfallCard) {
        return placeholder;
    }

    try {
        // --- LOGIC FLIPPED ---
        // 1. Check for DFCs FIRST. This is the most specific case.
        if (scryfallCard.card_faces && scryfallCard.card_faces[0].image_uris) {
            // It's a double-faced card, get the front face
            return scryfallCard.card_faces[0].image_uris.large;
            
        // 2. Fall back to regular cards.
        } else if (scryfallCard.image_uris) {
            // It's a single-faced card
            return scryfallCard.image_uris.large;
        }
    } catch (e) {
        // Fallback in case of weird data
        return placeholder;
    }

    return placeholder;
}