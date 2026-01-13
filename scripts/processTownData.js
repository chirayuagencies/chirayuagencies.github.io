const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, '../lib/party_count_town_details.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.trim());

// Find column indices
const townIndex = headers.indexOf('Town');
const districtIndex = headers.indexOf('District');
const stateIndex = headers.indexOf('State');
const partyCountIndex = headers.indexOf('Party Count');
const regionIndex = headers.indexOf('Region');

// Process data
const townMap = new Map();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const values = line.split(',').map(v => v.trim());
  const town = values[townIndex];
  const district = values[districtIndex] || '';
  const state = values[stateIndex] || '';
  const partyCount = parseFloat(values[partyCountIndex]) || 0;
  const region = values[regionIndex] || '';
  
  if (!town || town === '') continue;
  
  // Create unique key: town + district + state
  const key = `${town}|${district}|${state}`.toLowerCase();
  
  if (townMap.has(key)) {
    // Aggregate party counts for duplicates
    const existing = townMap.get(key);
    existing.partyCount += partyCount;
  } else {
    townMap.set(key, {
      name: town,
      district: district,
      state: state,
      region: region,
      partyCount: partyCount,
      coordinates: null // Will be filled by geocoding
    });
  }
}

// Convert to array and sort by party count (descending)
const towns = Array.from(townMap.values())
  .filter(town => town.partyCount > 0)
  .sort((a, b) => b.partyCount - a.partyCount);

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write JSON file
const outputPath = path.join(outputDir, 'townsData.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify({ towns }, null, 2),
  'utf-8'
);

console.log(`Processed ${towns.length} unique towns`);
console.log(`Output written to ${outputPath}`);
