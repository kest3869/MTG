// --- 1. Import our new modules ---
import { init as initScryfallMatcher } from './scryfallMatcher.js';
import {
    renderColorPairs,
    renderUnratedList,
    renderVarianceCards,
    renderTopCommons,
    renderTopUncommons,  // <-- NEW
    renderHotTakes,
    renderTopRares,
    renderTopMythics
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

        // --- C: Call all the render functions from our utils file
        renderColorPairs(
            analysisData.color_pair_averages, 
            document.getElementById('color-pairs-table')
        );
        renderUnratedList(
            analysisData.unrated_cards,
            document.getElementById('unrated-list')
        );
        renderVarianceCards(
            analysisData.top_15_variance,
            document.getElementById('variance-cards')
        );
        renderTopCommons(
            analysisData.top_3_commons_by_color,
            document.getElementById('top-commons')
        );
        // --- NEW: Added renderTopUncommons ---
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

        // --- D: Hide loading message
        loadingElement.style.display = 'none';

    } catch (error) {
        console.error("Failed to load or render data:", error);
        loadingElement.innerText = "Error: Could not load data files. See console for details.";
    }
}