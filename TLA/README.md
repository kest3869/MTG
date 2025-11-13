# MTG Set Analysis Dashboard

A simple web dashboard for analyzing and visualizing group-based MTG set reviews.

This tool takes individual card rating CSVs, runs a Python script to perform analysis (top cards, variance, "hot takes"), fetches card data from the Scryfall API, and then displays the results in a local web-based dashboard.

## Prerequisites

Python 3.x

Pandas library (pip install pandas)

Requests library (pip install requests)

#How to Use

The process is a 3-step build: Analyze -> Fetch -> View.

# 1. Add Rater Data

Place your rater CSV files (e.g., Kevin.csv, Nate.csv) inside the data/ folder.

Open sunrise_v2.py and update the raters = [...] list at the top to match your CSV filenames.

# 2. Run Analysis & Fetch Data

From your terminal in the project's root directory, run the following commands in order:

### 1. Run the analysis script to generate stats
python sunrise_v2.py


This creates analysis_results.json.

### 2. Run the Scryfall script to download card data
python fetch_scryfall.py


This creates scryfall_data.json.

### 3. View the Dashboard

You must run a local web server to view the index.html file (due to browser security policies for loading JSON).

In your terminal, start the Python web server:

python -m http.server


Open your web browser and navigate to:
http://localhost:8000/viewer/

The dashboard will load all the data and display your set analysis.