# raters
raters = ['Kevin', 'Nate', "Jon", 'Josh']

import pandas as pd
from itertools import combinations
import logging
import json
import sys

# --- 1. Setup Logging ---
logging.basicConfig(
    filename='analysis.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='w' 
)

logging.info("Script started.")

# --- 2. Setup Results Dictionary ---
results = {
    "raters": raters, # <-- NEW: Export rater names
    "unrated_cards": {},
    "color_pair_averages": [],
    "top_3_commons_by_color": [],
    "top_3_uncommons_by_color": [],
    "top_3_rares_by_color": [],    # <-- NEW
    "top_3_mythics_by_color": [], # <-- NEW
    "bottom_3_commons_by_color": [],
    "bottom_3_uncommons_by_color": [],
    "bottom_3_overall": [],
    "top_15_variance": [],
    "hot_takes": {},
    "all_cards": []
}

def read_ratings(rater):
    try:
        df = pd.read_csv(f'data/{rater}.csv')
    except FileNotFoundError:
        logging.error(f"Could not find file data/{rater}.csv. Please make sure it's in a 'data' subfolder.")
        return pd.DataFrame(columns=['Name', 'Rarity', 'Color', 'Rating'])
        
    if 'Name' in df.columns:
        df['Name'] = df['Name'].str.strip()
    else:
        logging.warning(f"'Name' column not found in {rater}.csv")
        df['Name'] = pd.NA 
        
    rarity_map = {
        'common': 'C',
        'uncommon': 'U',
        'rare': 'R',
        'mythic': 'M'
    }
    if 'Rarity' in df.columns:
        df['Rarity'] = df['Rarity'].map(rarity_map)
    else:
        logging.warning(f"'Rarity' column not found in {rater}.csv")
        df['Rarity'] = pd.NA 

    if 'Color' in df.columns:
        df['Color'] = df['Color'].fillna('C')
        df['Color'] = df['Color'].apply(lambda x: 'M' if isinstance(x, str) and len(x) > 1 else x)
    else:
        logging.warning(f"'Color' column not found in {rater}.csv")
        df['Color'] = pd.NA 
        
    if 'Rating' not in df.columns:
        logging.warning(f"'Rating' column not found in {rater}.csv")
        df['Rating'] = pd.NA 

    return df[['Name', 'Rarity', 'Color', 'Rating']]

tier_num = {'G':0., 'D-': 1., 'D': 2., 'D+': 3., 
            'C-': 4., 'C': 5., 'C+': 6., 'B-': 7., 
            'B': 8., 'B+': 9., 'A-': 10., 'A': 11., 
            'A+': 12.}

if not raters:
    logging.error("Error: 'raters' list is empty. Please define it.")
    sys.exit() 
    
logging.info(f"Loading ratings for {raters[0]}.")
eos = read_ratings(raters[0])
eos.rename(columns={'Rating': raters[0]}, inplace=True)

for rater in raters[1:]:
    logging.info(f"Loading and merging ratings for {rater}.")
    rater_data = read_ratings(rater)
    rater_ratings = rater_data[['Name', 'Rating']].rename(columns={'Rating': rater})
    eos = pd.merge(eos, rater_ratings, on='Name', how='outer')

logging.info("--- Unrated Card Analysis ---")
all_cards_rated = True
for rater in raters:
    unrated_cards = eos[eos[rater].isnull()]['Name']
    if unrated_cards.empty:
        logging.info(f"All cards were rated by {rater}.")
        results["unrated_cards"][rater] = []
    else:
        all_cards_rated = False
        unrated_list = unrated_cards.tolist()
        logging.warning(f"Cards NOT rated by {rater}: {unrated_list}")
        results["unrated_cards"][rater] = unrated_list
        
if all_cards_rated and not eos[raters[0]].isnull().any():
    logging.info("All raters rated all cards. Perfect match.")

logging.info("Excluding basic lands from analysis.")
basic_lands = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest']
eos = eos[~eos['Name'].isin(basic_lands)]

logging.info("="*30)
logging.info("Converting letter grades to numeric values.")

for rater in raters:
    eos[f'{rater}_num'] = eos[rater].map(tier_num)

rater_num_cols = [f'{rater}_num' for rater in raters]
eos_clean = eos.dropna(subset=rater_num_cols).copy()

colors = ['W', 'R', 'B', 'U', 'G']

eos['Group'] = eos[[rater + '_num' for rater in raters]].sum(axis=1) / len(raters)

logging.info("Calculating average rating by color pair.")
color_pairs = list(combinations(colors, 2))
color_pair_scores = {}

for pair in color_pairs:
    color1, color2 = pair
    pair_rows = eos[(eos['Color'] == color1) | (eos['Color'] == color2)] 
    
    total_score = 0.0
    if len(pair_rows) > 0:
        total_score = round(pair_rows['Group'].sum() / len(pair_rows), 2)
    
    color_pair_scores[pair] = total_score

sorted_color_pair_list = sorted(color_pair_scores.items(), key=lambda item: item[1], reverse=True)

for pair, score in sorted_color_pair_list:
    results["color_pair_averages"].append({
        "colors": f"{pair[0]}/{pair[1]}",
        "average_rating": score
    })

# --- Top 3 Commons by Color ---
# (Using your original, working code)
logging.info("Calculating top 3 commons by color.")
eos_commons = eos[eos['Rarity'] == 'C']
top_cards_by_color_c = eos_commons.groupby('Color').apply(
    lambda x: x.nlargest(3, 'Group'), 
    include_groups=False
).reset_index()
results['top_3_commons_by_color'] = top_cards_by_color_c[['Name', 'Color', 'Group']].to_dict('records')

# --- Top 3 Uncommons by Color ---
# (Using your original, working code)
logging.info("Calculating top 3 uncommons by color.")
eos_uncommons = eos[eos['Rarity'] == 'U']
top_cards_by_color_u = eos_uncommons.groupby('Color').apply(lambda x: x.nlargest(3, 'Group')).reset_index(drop=True)
results['top_3_uncommons_by_color'] = top_cards_by_color_u[['Name', 'Color', 'Group']].to_dict('records')

# --- NEW: Top 3 Rares by Color ---
# (Following your established pattern for uncommons)
logging.info("Calculating top 3 rares by color.")
eos_rares = eos[eos['Rarity'] == 'R']
top_cards_by_color_r = eos_rares.groupby('Color').apply(lambda x: x.nlargest(3, 'Group')).reset_index(drop=True)
results['top_3_rares_by_color'] = top_cards_by_color_r[['Name', 'Color', 'Group']].to_dict('records')

# --- NEW: Top 3 Mythics by Color ---
# (Following your established pattern for uncommons)
logging.info("Calculating top 3 mythics by color.")
eos_mythics = eos[eos['Rarity'] == 'M']
top_cards_by_color_m = eos_mythics.groupby('Color').apply(lambda x: x.nlargest(3, 'Group')).reset_index(drop=True)
results['top_3_mythics_by_color'] = top_cards_by_color_m[['Name', 'Color', 'Group']].to_dict('records')


# --- Bottom 3 Commons by Color ---
# (Using your original, working code)
logging.info("Calculating bottom 3 commons by color.")
eos_commons = eos[eos['Rarity'] == 'C']
bottom_cards_by_color_c = eos_commons.groupby('Color').apply(
    lambda x: x.nsmallest(3, 'Group'), 
    include_groups=False
).reset_index()
results['bottom_3_commons_by_color'] = bottom_cards_by_color_c[['Name', 'Color', 'Group']].to_dict('records')

# --- Bottom 3 Uncommons by Color ---
# (Using your original, working code)
logging.info("Calculating bottom 3 uncommons by color.")
eos_uncommons = eos[eos['Rarity'] == 'U']
bottom_cards_by_color_u = eos_uncommons.groupby('Color').apply(lambda x: x.nsmallest(3, 'Group')).reset_index(drop=True)
results['bottom_3_uncommons_by_color'] = bottom_cards_by_color_u[['Name', 'Color', 'Group']].to_dict('records')

# --- Bottom 3 Overall ---
# (Using your original, working code)
logging.info("Calculating bottom 3 cards overall.")
sorted_eos = eos.sort_values(by='Group', ascending=True).copy()
bottom_3_overall_df = sorted_eos[['Name', 'Group']][:3]
results['bottom_3_overall'] = bottom_3_overall_df.to_dict('records')

# --- Variance Analysis ---
# (Using your original, working code)
logging.info("Calculating top 15 variance cards.")
eos['Variance'] = eos[[rater + '_num' for rater in raters]].var(axis=1)
sorted_eos = eos.sort_values(by='Variance', ascending=False).copy()
top_15_variance_df = sorted_eos[['Name', 'Variance', 'Group']][:15]
results['top_15_variance'] = top_15_variance_df.to_dict('records')

# --- "Hot Take" Analysis ---
# (Using your original, working code)
logging.info("Calculating top 3 'hot takes' for each rater.")
for rater in raters:
    other_raters = [col for col in eos.columns if col.endswith('_num') and col != f'{rater}_num']
    eos[f'{rater}_mean'] = eos[other_raters].mean(axis=1)

for rater in raters:
    eos[f'{rater}_Hot_Take'] = abs(eos[f'{rater}_num'] - eos[f'{rater}_mean'])

for rater in raters:
    sorted_eos = eos.sort_values(by= rater + '_Hot_Take', ascending=False).copy()
    # --- UPDATED: Add 'Group' and all rater letter grades for context ---
    hot_takes_df = sorted_eos[['Name', rater + '_Hot_Take', 'Group'] + raters][:3]
    results['hot_takes'][rater] = hot_takes_df.to_dict('records')

# --- 3. Save Full Card List ---
logging.info("Saving full card list to results dictionary.")
output_columns = ['Name', 'Rarity', 'Color', 'Group', 'Variance'] + raters
json_friendly_eos = eos[output_columns].copy().replace({pd.NA: None, pd.NaT: None})
results['all_cards'] = json_friendly_eos.to_dict('records')

# --- 4. Write Results to JSON File ---
output_filename = 'analysis_results.json'
logging.info(f"Writing all results to {output_filename}")
try:
    with open(output_filename, 'w') as f:
        json.dump(results, f, indent=4)
    logging.info("Successfully wrote results to JSON file.")
except Exception as e:
    logging.error(f"Failed to write JSON file: {e}")

logging.info('Script finished.')