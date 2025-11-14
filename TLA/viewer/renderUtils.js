// This module exports all functions that build HTML
// --- UPDATED: Import scryfallMap ---
import { getImageUrl, scryfallMap } from './scryfallMatcher.js';

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

// --- WUBRGC Sort Order Map ---
const wubrgcOrder = {
    'W': 1,
    'U': 2,
    'B': 3,
    'R': 4,
    'G': 5,
    'C': 6,
    'M': 7
};

// --- Python's color order for matching keys ---
const PYTHON_COLOR_ORDER = { 'W': 1, 'R': 2, 'B': 3, 'U': 4, 'G': 5 };

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
    
    // Sort by average_rating, descending
    colorPairs.sort((a, b) => b.average_rating - a.average_rating);

    for (const pair of colorPairs) {
        const wubrgDotOrder = { 'W': 1, 'U': 2, 'B': 3, 'R': 4, 'G': 5 };
        const [c1, c2] = pair.colors.split('/').sort((a, b) => wubrgDotOrder[a] - wubrgDotOrder[b]);
        
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
 * Renders the gallery of Signpost Uncommons (Uncommon + Multicolored).
 */
export function renderSignpostUncommons(allCards, raters, container, colorPairRankMap) { 
    if (!allCards || !raters || allCards.length === 0) {
        container.innerHTML = "<p>No card data found.</p>";
        return;
    }

    const signposts = allCards.filter(card => card.Rarity === 'U' && card.Color === 'M');

    if (signposts.length === 0) {
        container.innerHTML = "<p>No signpost uncommons found.</p>";
        return;
    }

    const getSortValue = (card) => {
        const frontFaceName = card.Name.split(/\s*\/\/\s*/)[0];
        const scryfallCard = scryfallMap.get(frontFaceName);
        
        if (scryfallCard && scryfallCard.colors && scryfallCard.colors.length === 2) {
            const [c1, c2] = scryfallCard.colors.sort((a, b) => PYTHON_COLOR_ORDER[a] - PYTHON_COLOR_ORDER[b]);
            const pairKey = `${c1}/${c2}`;
            
            if (colorPairRankMap && colorPairRankMap.has(pairKey)) {
                return colorPairRankMap.get(pairKey);
            }
        }
        return 99; // Put cards we can't find at the end
    };

    signposts.sort((a, b) => getSortValue(a) - getSortValue(b));

    let html = '';
    for (const card of signposts) {
        const imageUrl = getImageUrl(card.Name);
        
        const raterScores = raters.map(rName => 
            `${rName.charAt(0)}: ${card[rName] || 'N/A'}`
        ).join(', ');

        html += `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Name}">
                <p class="card-name">${card.Name}</p>
                <p class="card-stat">Group Avg: ${getGroupLetter(card.Group)} (${card.Group.toFixed(2)})</p>
                <p class="card-stat rater-scores">Scores: ${raterScores}</p>
            </div>
        `;
    }
    container.innerHTML = html;
}


/**
 * Renders the gallery of high-variance cards.
 */
export function renderVarianceCards(varianceCards, container, fullCardDataMap, raters) {
    if (!varianceCards || varianceCards.length === 0) {
        container.innerHTML = "<p>No variance data found.</p>";
        return;
    }

    let html = '';
    for (const card of varianceCards) {
        const imageUrl = getImageUrl(card.Name);
        
        let raterScores = '';
        if (fullCardDataMap && raters) {
            const fullCard = fullCardDataMap.get(card.Name);
            if (fullCard) {
                raterScores = raters.map(rName => 
                    `${rName.charAt(0)}: ${fullCard[rName] || 'N/A'}`
                ).join(', ');
            }
        }

        html += `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Name}">
                <p class="card-name">${card.Name}</p>
                <p class="card-stat">Variance: ${card.Variance.toFixed(2)}</p>
                <p class="card-stat">Group Avg: ${getGroupLetter(card.Group)} (${card.Group.toFixed(2)})</p>
                <p class="card-stat rater-scores">Scores: ${raterScores}</p>
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

    topCommons.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; 

    for (const card of topCommons) {
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }

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

    topUncommons.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; 

    for (const card of topUncommons) {
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }

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

    topRares.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; 

    for (const card of topRares) {
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }
        
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

    topMythics.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; 

    for (const card of topMythics) {
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }

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
                    </p>
                    <p class="card-stat">Group Avg: ${getGroupLetter(take.Group)} (${take.Group.toFixed(2)})</p>
                    <p class="card-stat rater-scores">Scores: ${raterScores}</p>
                </div>
            `;
        }
    }
    container.innerHTML = html;
}

/**
 * Renders the gallery of bottom 3 commons by color.
 */
export function renderBottomCommons(bottomCommons, container) {
    if (!bottomCommons || bottomCommons.length === 0) {
        container.innerHTML = "<p>No bottom common data found.</p>";
        return;
    }

    // Sort the array by WUBRGC order
    bottomCommons.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; 

    for (const card of bottomCommons) {
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }

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
 * Renders the gallery of bottom 3 uncommons by color.
 */
export function renderBottomUncommons(bottomUncommons, container) {
    if (!bottomUncommons || bottomUncommons.length === 0) {
        container.innerHTML = "<p>No bottom uncommon data found.</p>";
        return;
    }

    // Sort the array by WUBRGC order
    bottomUncommons.sort((a, b) => wubrgcOrder[a.Color] - wubrgcOrder[b.Color]);

    let html = '';
    let currentColor = null; 

    for (const card of bottomUncommons) {
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }

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
 * Renders the gallery of bottom 3 cards overall.
 */
export function renderBottomOverall(bottomOverall, container) {
    if (!bottomOverall || bottomOverall.length === 0) {
        container.innerHTML = "<p>No bottom overall data found.</p>";
        return;
    }

    let html = '';
    for (const card of bottomOverall) {
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

// --- NEW FUNCTION ---
/**
 * Renders the gallery for the full set review.
 * @param {Array} allCards - The full list of cards from analysis_results.json
 * @param {Array} raters - The list of rater names
 * @param {HTMLElement} container - The <div> to put the gallery in
 */
export function renderFullSetReview(allCards, raters, container) {
    if (!allCards || !raters || allCards.length === 0) {
        container.innerHTML = "<p>No card data found.</p>";
        return;
    }

    // Sort by WUBRGC order, then alphabetically by name
    allCards.sort((a, b) => {
        const colorSort = wubrgcOrder[a.Color] - wubrgcOrder[b.Color];
        if (colorSort !== 0) return colorSort;
        return a.Name.localeCompare(b.Name);
    });

    let html = '';
    let currentColor = null; 

    for (const card of allCards) {
        // --- Add the grid-alignment break logic ---
        if (card.Color !== currentColor) {
            if (currentColor !== null) {
                html += '<div class="gallery-group-break"></div>';
            }
            currentColor = card.Color;
        }
        // --- End logic ---

        const imageUrl = getImageUrl(card.Name);
        
        const raterScores = raters.map(rName => 
            `${rName.charAt(0)}: ${card[rName] || 'N/A'}`
        ).join(', ');

        html += `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Name}">
                <p class="card-name">${card.Name}</p>
                <p class="card-stat">Group Avg: ${getGroupLetter(card.Group)} (${card.Group.toFixed(2)})</p>
                <p class="card-stat rater-scores">Scores: ${raterScores}</p>
            </div>
        `;
    }
    container.innerHTML = html;
}
// --- END NEW FUNCTION ---