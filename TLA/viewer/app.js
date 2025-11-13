// --- 1. Import our new modules ---
import { init as initScryfallMatcher } from './scryfallMatcher.js';
import {
    renderColorPairs,
    renderUnratedList,
    renderSignpostUncommons, 
    renderVarianceCards,
    renderTopCommons,
    renderTopUncommons,
    renderHotTakes,
    renderTopRares,
    renderTopMythics,
    renderBottomCommons,
    renderBottomUncommons,
    renderBottomOverall
} from './renderUtils.js';


// --- 2. Add event listener to start the app ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// --- 3. The "Driver" Function ---
async function initializeApp() {
    const loadingElement = document.getElementById('loading-state');
    
    try {
        // --- A: "Prime" the scryfall matcher. It will load its own data.
        await initScryfallMatcher();

        // --- B: Load the main analysis data
        const analysisData = await fetch('../analysis_results.json').then(res => res.json());

        // --- C: Create a lookup map from the 'all_cards' list
        const fullCardDataMap = new Map(analysisData.all_cards.map(card => [card.Name, card]));

        // --- NEW: Create a sort order map from the color pair data ---
        // This list is already sorted by descending rating from Python
        const colorPairRankMap = new Map();
        analysisData.color_pair_averages.forEach((pair, index) => {
            colorPairRankMap.set(pair.colors, index); // e.g., {'W/G': 0, 'W/U': 1, ...}
        });
        // --- END NEW ---

        // --- D: Call all the render functions from our utils file
        renderColorPairs(
            analysisData.color_pair_averages, 
            document.getElementById('color-pairs-table')
        );
        renderUnratedList(
            analysisData.unrated_cards,
            document.getElementById('unrated-list')
        );

        // --- UPDATED: Pass the new rank map ---
        renderSignpostUncommons(
            analysisData.all_cards,
            analysisData.raters,
            document.getElementById('signpost-uncommons'),
            colorPairRankMap // Pass the new map here
        );

        renderVarianceCards(
            analysisData.top_15_variance,
            document.getElementById('variance-cards'),
            fullCardDataMap,
            analysisData.raters
        );
        renderTopCommons(
            analysisData.top_3_commons_by_color,
            document.getElementById('top-commons')
        );
        renderTopUncommons(
            analysisData.top_3_uncommons_by_color,
            document.getElementById('top-uncommons')
        );
        renderTopRares(
            analysisData.top_3_rares_by_color,
            document.getElementById('top-rares')
        );
        renderTopMythics(
            analysisData.top_3_mythics_by_color,
            document.getElementById('top-mythics')
        );
        renderHotTakes(
            analysisData.hot_takes,
            analysisData.raters,
            document.getElementById('hot-takes')
        );
        renderBottomCommons(
            analysisData.bottom_3_commons_by_color,
            document.getElementById('bottom-commons')
        );
        renderBottomUncommons(
            analysisData.bottom_3_uncommons_by_color,
            document.getElementById('bottom-uncommons')
        );
        renderBottomOverall(
            analysisData.bottom_3_overall,
            document.getElementById('bottom-overall')
        );

        // --- E: Hide loading message
        loadingElement.style.display = 'none';

    } catch (error) {
        console.error("Failed to load or render data:", error);
        loadingElement.innerText = "Error: Could not load data files. See console for details.";
    }
}