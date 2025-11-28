MTG Set Analysis Dashboard: Architecture & V2 Refactor Plan
This document outlines the current V1 architecture of the dashboard (for both local development and deployment) and provides a detailed plan for a V2 refactor to make the codebase more modular and maintainable.
Current Architecture (V1) Summary
The current system is a powerful static-site generator. It consists of two main parts:
A Python Data Pipeline: A set of scripts (sunrise_v2.py, fetch_scryfall.py) that run in the project root. They read local .csv files, perform analysis, fetch card data, and generate two "bridge" JSON files (analysis_results.json, scryfall_data.json) into the project root.
A JavaScript Static Site: A self-contained docs/ directory. It reads the .json files and dynamically builds the entire dashboard in the user's browser.
How it Works: The "Two-Folder" Workflow
A new user who clones the repository must follow this workflow, which accounts for both local development and deploying to the hosted (GitHub Pages) version.
Schematic:
[Local Machine]                                 |  [GitHub Pages (Web)]
------------------------------------------------|-------------------------
/your-project/                                  |
|                                               |
|-- data/raters.csv                             |
|    |                                          |
|    +--> sunrise_v2.py                         |
|    |      |                                   |
|    |      V                                   |
|    +--> analysis_results.json  ---(MANUAL)-->  |  docs/analysis_results.json
|           |                                   |    |
|           V                                   |    V
|    +--> fetch_scryfall.py                     |  docs/app.js  <-- (Fetches './')
|           |                                   |    |
|           V                                   |    V
|    +--> scryfall_data.json   ---(MANUAL)-->  |  docs/scryfall_data.json
|                                               |
|-- viewer/                                     |
|   |                                           |
|   +--> app.js  <-- (Fetches '../')             |
|                                               |
+-----------------------------------------------+


Workflow for a New User:
Run Analysis (in Root):
python sunrise_v2.py
python fetch_scryfall.py
This creates analysis_results.json and scryfall_data.json in the project root.
View Locally (Optional):
Run python -m http.server from the project root.
Open http://localhost:8000/viewer/
This works because viewer/app.js is configured to find the JSON files one directory up (fetch('../analysis_results.json')).
Update Hosted Version (Manual Step):
Manually copy the new analysis_results.json and scryfall_data.json from the project root.
Paste them into the docs/ folder, overwriting the old ones.
The docs/app.js is configured to find JSON in its own directory (fetch('./analysis_results.json')).
git add docs/
git commit -m "Update analysis data"
git push
This manual copy step is what allows the docs/ folder to be a self-contained, deployable unit while keeping your analysis scripts separate.
V2 Refactor Plan
The V1 architecture is functional, but the files sunrise_v2.py and renderUtils.js do too much. The V2 refactor will modularize both parts.
1. Python Pipeline Refactor
The sunrise_v2.py script will be replaced by an analysis_pipeline package.
New Directory Structure:
/your-project/
|-- analysis_pipeline/
|   |-- __init__.py
|   |-- run_analysis.py     <-- Main driver to run
|   |-- config.py           <-- Constants (Raters, Tiers, etc.)
|   |-- data_loader.py      <-- Handles pandas read/merge/prep
|   |-- analysis/           <-- Sub-package for all analysis tasks
|   |   |-- __init__.py
|   |   |-- color_pairs.py
|   |   |-- hot_takes.py
|   |   |-- top_bottom_cards.py
|   |   |-- signpost_uncommons.py
|   |   |-- variance.py
|   |   |-- full_review.py
|   |   |-- unrated.py
|   |-- json_exporter.py    <-- Saves the final `results` dict
|
|-- sunrise_v2.py           <-- (This file will be deleted)


File Responsibilities:
run_analysis.py (The Driver): Becomes the main entry point (python -m analysis_pipeline.run_analysis). It imports config, loads data via data_loader, calls each function in the analysis/ package to build the results dictionary, and saves it with json_exporter.
config.py (Constants): Stores all global constants: RATERS, TIER_NUM_MAP, BASIC_LANDS, COLORS, PYTHON_COLOR_ORDER, etc.
data_loader.py (Data Prep): Handles the pd.merge loop, filters lands, and applies the _num and Group columns. Returns the master eos DataFrame.
analysis/ (Sub-package): Each file will contain one function that takes the eos DataFrame and returns a piece of the results dictionary (e.g., {'top_3_commons...': [...]}).
json_exporter.py (Output): Contains a single function save_results(results_dict, ...) that handles the final json.dump().
2. JavaScript Viewer Refactor
The renderUtils.js file will be replaced by a new viewer/modules/ directory.
New Directory Structure:
/your-project/
|-- viewer/ (or docs/)
|   |-- app.js              (Stays as the main driver)
|   |-- scryfallMatcher.js  (Stays the same, already modular)
|   |-- modules/            <-- NEW DIRECTORY
|   |   |-- constants.js      <-- NEW (WUBRG maps, grade maps)
|   |   |-- helpers.js        <-- NEW (getGroupLetter)
|   |   |-- renderColorPairs.js
|   |   |-- renderCardGallery.js
|   |   |-- renderUnrated.js
|   |
|   |-- renderUtils.js      <-- (This file will be deleted)
|   |-- index.html
|   |-- style.css


File Responsibilities:
modules/constants.js: Stores all shared "magic numbers" for the front end: WUBRG_COLORS, NUM_TO_TIER, WUBRGC_ORDER, etc.
modules/helpers.js: Stores shared utility functions like getGroupLetter(groupNum).
modules/renderColorPairs.js / renderUnrated.js: These are unique layouts and will each be their own module, exporting a default render function.
modules/renderCardGallery.js (The Key Refactor): This file will contain one generic function to render all card galleries.
It will replace renderSignpostUncommons, renderVarianceCards, renderHotTakes, all renderTop... functions, all renderBottom... functions, and renderFullSetReview.
It will be made generic by passing in a callback function from app.js that defines what stat lines to render for each card (e.g., (card) => ["<p>Variance: ...</p>", "<p>Group Avg: ...</p>"]).
app.js (Updated Driver): The imports at the top will change from renderUtils.js to the new modules/ files. The initializeApp function will remain clean, but its calls will be slightly different (e.g., calling renderCardGallery 10+ times with different data and stat-line callbacks).
