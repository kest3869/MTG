// This module exports all functions that build HTML
import { getImageUrl } from './scryfallMatcher.js';

// --- WUBRG Color Map ---
const wubrgColors = {
    'W': '#F8F7D8', // White
    'U': '#C1D7E9', // Blue
    'B': '#ACA29A', // Black
    'R': '#E8A38B', // Red
    'G': '#C3D3C1'  // Green
};

// --- Map for converting numeric grade to letter grade ---
const num_to_tier = {
    0: 'G', 1: 'D-', 2: 'D', 3: 'D+',
    4: 'C-', 5: 'C', 6: 'C+', 7: 'B-',
    8: 'B', 9: 'B+', 10: 'A-', 11: 'A',
    12: 'A+'
};

// --- NEW: WUBRGC Sort Order Map ---
// (Using 'C' for Colorless and 'M' for Multicolored)
const wubrgcOrder = {
    'W': 1,
    'U': 2,
    'B': 3,
    'R': 4,
    'G': 5,
    'C': 6,
    'M': 7
};

// --- Helper function to get the letter grade ---
function getGroupLetter(groupNum) {
    if (groupNum === null || groupNum === undefined) return 'N/A';
    const rounded = Math.round(groupNum);
    return num_to_tier[rounded] || 'N/A';
}

/**
 * Renders a simple table for the color pair averages.
 */
export function renderColorPairs(colorPairs, container) {
    if (!colorPairs || colorPairs.length === 0) {
        container.innerHTML = "<p>No color pair data found.</p>";
        return;
    }

    let html = '<table>';
    html += '<tr><th>Color Pair</th><th>Average Rating</th></tr>';
    
    // This function already has its own WUBRG sort logic
    const wubrgOrder = { 'W': 1, 'U': 2, 'B': 3, 'R': 4, 'G': 5 };
    const getSortValue = (pairStr) => {
        const [c1, c2] = pairStr.split('/');
        return wubrgOrder[c1] * 10 + wubrgOrder[c2];
    };
    
    colorPairs.sort((a, b) => getSortValue(a.colors) - getSortValue(b.colors));

    for (const pair of colorPairs) {
        const [c1, c2] = pair.colors.split('/');
        
        html += `
            <tr>
                <td>
                    <div class="color-dot-container">
                        <span class="color-dot" style="background-color: ${wubrgColors[c1]}"></span>
                        <span class="color-dot" style="background-color: ${wubrgColors[c2]}"></span>
                        ${pair.colors}
                    </div>
                </td>
                <td>${pair.average_rating.toFixed(2)}</td>
            </tr>
        `;
    }

    html += '</table>';
    container.innerHTML = html;
}

/**
 * Renders the list of unrated cards, grouped by rater.
 */
export function renderUnratedList(unratedData, container) {
    if (!unratedData) {
        container.innerHTML = "<p>No unrated card data.</p>";
        return;
    }

    let html = '';
    for (const rater in unratedData) {
        const cards = unratedData[rater];
        if (cards.length > 0) {
            html += `<h3>${rater}</h3><ul>`;
            html += cards.map(cardName => `<li>${cardName}</li>`).join('');
            html += `</ul>`;
        } else {
            html += `<h3>${rater}</h3><p>All cards rated!</p>`;
        }
    }
    
    container.innerHTML = html;
}

/**
 * Renders the gallery of high-variance cards.
 */
export function renderVarianceCards(varianceCards, container) {
    if (!varianceCards || varianceCards.length === 0) {
        container.innerHTML = "<p>No variance data found.</p>";
        return;
    }

    let html = '';
    for (const card of varianceCards) {
        const imageUrl = getImageUrl(card.Name);
        
        html += `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Name}">
                <p class="card-name">${card.Name}</p>
                <p class="card-stat">Variance: ${card.Variance.toFixed(2)}</p>
                <p class="card-stat">Group Avg: ${getGroupLetter(card.Group)} (${card.Group.toFixed(2)})</p>
            </div>
        `;
    }
    container.innerHTML = html;
}

/**
 * Renders the gallery of top 3 commons by color.
 */
export function renderTopCommons(topCommons, container) {
    if (!topCommons || topCommons.length === 0) {
        container.innerHTML = "<p>No top common data found.</p>";
        return;
    }

    // --- NEW: Sort the array by WUBRGC order ---
    topCommons.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; // --- HACKY FIX: Track current color ---

    for (const card of topCommons) {
        // --- HACKY FIX: Check if color is changing ---
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                // If this isn't the first card, add a row break
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }
        // --- END FIX ---

        const imageUrl = getImageUrl(card.Name);
        
        html += `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Name}">
                <p class="card-name">${card.Name}</p>
                <p class="card-stat">Group Avg: ${getGroupLetter(card.Group)} (${card.Group.toFixed(2)})</p>
            </div>
        `;
    }
    container.innerHTML = html;
}

/**
 * Renders the gallery of top 3 uncommons by color.
 */
export function renderTopUncommons(topUncommons, container) {
    if (!topUncommons || topUncommons.length === 0) {
        container.innerHTML = "<p>No top uncommon data found.</p>";
        return;
    }

    // --- NEW: Sort the array by WUBRGC order ---
    topUncommons.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; // --- HACKY FIX: Track current color ---

    for (const card of topUncommons) {
        // --- HACKY FIX: Check if color is changing ---
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }
        // --- END FIX ---

        const imageUrl = getImageUrl(card.Name);
        
        html += `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Name}">
                <p class="card-name">${card.Name}</p>
                <p class="card-stat">Group Avg: ${getGroupLetter(card.Group)} (${card.Group.toFixed(2)})</p>
            </div>
        `;
    }
    container.innerHTML = html;
}

/**
 * Renders the gallery of top 3 rares by color.
 */
export function renderTopRares(topRares, container) {
    if (!topRares || topRares.length === 0) {
        container.innerHTML = "<p>No top rare data found.</p>";
        return;
    }

    // --- NEW: Sort the array by WUBRGC order ---
    topRares.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; // --- HACKY FIX: Track current color ---

    for (const card of topRares) {
        // --- HACKY FIX: Check if color is changing ---
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }
        // --- END FIX ---
        
        const imageUrl = getImageUrl(card.Name);
        
        html += `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Name}">
                <p class="card-name">${card.Name}</p>
                <p class="card-stat">Group Avg: ${getGroupLetter(card.Group)} (${card.Group.toFixed(2)})</p>
            </div>
        `;
    }
    container.innerHTML = html;
}

/**
 * Renders the gallery of top 3 mythics by color.
 */
export function renderTopMythics(topMythics, container) {
    if (!topMythics || topMythics.length === 0) {
        container.innerHTML = "<p>No top mythic data found.</p>";
        return;
    }

    // --- NEW: Sort the array by WUBRGC order ---
    topMythics.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; // --- HACKY FIX: Track current color ---

    for (const card of topMythics) {
        // --- HACKY FIX: Check if color is changing ---
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }
        // --- END FIX ---

        const imageUrl = getImageUrl(card.Name);
        
        html += `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Name}">
                <p class="card-name">${card.Name}</p>
                <p class="card-stat">Group Avg: ${getGroupLetter(card.Group)} (${card.Group.toFixed(2)})</p>
            </div>
        `;
    }
    container.innerHTML = html;
}


/**
 * Renders the "hot takes" as cards.
 */
export function renderHotTakes(hotTakesData, raters, container) {
    if (!hotTakesData || !raters) {
        container.innerHTML = "<p>No hot take data.</p>";
        return;
    }

    let html = '';
    for (const rater of raters) {
        const takes = hotTakesData[rater];
        
        for (const take of takes) {
            const imageUrl = getImageUrl(take.Name);
            
            const raterScores = raters.map(rName => 
                `${rName.charAt(0)}: ${take[rName] || 'N/A'}`
            ).join(', ');

            html += `
                <div class="card">
                    <img src="${imageUrl}" alt="${take.Name}">
                    <p class="card-name">${take.Name}</p>
                    <p class="card-stat hot-take-value">
                        ${rater}'s Take: +${take[rater + '_Hot_Take'].toFixed(2)}
                    </D>
                    <p class="card-stat">Group Avg: ${getGroupLetter(take.Group)} (${take.Group.toFixed(2)})</p>
                    <p class="card-stat rater-scores">Scores: ${raterScores}</p>
                </div>
            `;
        }
    }
    container.innerHTML = html;
}