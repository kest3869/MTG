import json
import requests
import logging
import sys
import pandas as pd
import re # <-- NEW: Import the regex module

# --- Setup Logging ---
logging.basicConfig(
    filename='scryfall_fetch.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='w'
)

ANALYSIS_FILE = 'analysis_results.json'
OUTPUT_FILE = 'scryfall_data.json'
SCRYFALL_API_URL = 'https://api.scryfall.com/cards/collection'

logging.info("Script started.")

# --- 1. Load Analysis Results ---
try:
    with open(ANALYSIS_FILE, 'r') as f:
        analysis_data = json.load(f)
    logging.info(f"Successfully loaded {ANALYSIS_FILE}")
except FileNotFoundError:
    logging.error(f"FATAL: Could not find {ANALYSIS_FILE}. Run sunrise_v2.py first.")
    sys.exit(f"Error: Could not find {ANALYSIS_FILE}. Run sunrise_v2.py first.")
except json.JSONDecodeError:
    sys.exit(f"Error: Could not decode JSON from {ANALYSIS_FILE}.")

# --- 2. Get Card Names ---
try:
    all_cards = analysis_data.get('all_cards', [])
    if not all_cards:
        logging.warning("No cards found in 'all_cards' key. Nothing to fetch.")
        sys.exit("Warning: No cards found in 'all_cards' key. Nothing to fetch.")

    # --- UPDATED: Use regex to get only the front-face name ---
    identifiers = []
    for card in all_cards:
        # Use regex to split on ' // ' (ignoring spaces)
        # This mirrors the logic in our JavaScript
        front_face_name = re.split(r'\s*\/\/\s*', card['Name'])[0]
        identifiers.append({"name": front_face_name})
    # --- END UPDATE ---
    
    logging.info(f"Found {len(identifiers)} cards to fetch. Will process in chunks.")
    
    all_scryfall_data = []
    
    for i in range(0, len(identifiers), 75):
        chunk = identifiers[i:i+75]
        payload = {"identifiers": chunk}
        
        logging.info(f"Fetching chunk {i//75 + 1}...")
        
        # --- 3. Make API Request ---
        try:
            response = requests.post(SCRYFALL_API_URL, json=payload, headers={'Content-Type': 'application/json'})
            response.raise_for_status() 
            
            response_data = response.json()
            
            if 'data' in response_data and response_data['data']:
                all_scryfall_data.extend(response_data['data'])
            
            if 'not_found' in response_data and response_data['not_found']:
                not_found_names = [item.get('name', 'Unknown') for item in response_data['not_found']]
                logging.warning(f"Could not find data for: {not_found_names}")

        except requests.exceptions.HTTPError as e:
            logging.error(f"HTTP Error: {e.response.status_code}. Response: {e.response.text}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Request failed: {e}")
        
    logging.info(f"Successfully fetched data for {len(all_scryfall_data)} cards.")

    # --- 4. Save Scryfall Data ---
    if all_scryfall_data:
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(all_scryfall_data, f, indent=4)
        logging.info(f"Successfully saved Scryfall data to {OUTPUT_FILE}")
        print(f"Success! Scryfall data saved to {OUTPUT_FILE}")
    else:
        logging.warning("No data was fetched from Scryfall. Output file not written.")
        print("Warning: No data was fetched from Scryfall. Output file not written.")

except KeyError:
    logging.error("FATAL: 'all_cards' key not found in JSON.")
except Exception as e:
    logging.error(f"An unexpected error occurred: {e}")

logging.info("Script finished.")