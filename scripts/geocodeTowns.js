const fs = require('fs');
const path = require('path');

// Read the processed towns data
const dataPath = path.join(__dirname, '../src/data/townsData.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Known coordinates for major cities (to avoid API calls for common places)
const knownCoordinates = {
  'indore|indore|madhya pradesh': [75.8573, 22.7196],
  'bhopal|bhopal|madhya pradesh': [77.4126, 23.2599],
  'gwalior|gwalior|madhya pradesh': [78.1828, 26.2183],
  'jabalpur|jabalpur|madhya pradesh': [79.9500, 23.1815],
  'ujjain|ujjain|madhya pradesh': [75.7849, 23.1765],
  'ratlam|ratlam|madhya pradesh': [75.0364, 23.3315],
  'delhi||': [77.2090, 28.6139],
  'agra||': [78.0081, 27.1767],
  'kanpur||': [80.3319, 26.4499],
  'raipur||': [81.6296, 21.2514],
  'mumbai|mumbai|maharashtra': [72.8777, 19.0760],
};

// Function to geocode using Nominatim (free, no API key required)
async function geocodeTown(town, district, state) {
  const key = `${town}|${district}|${state}`.toLowerCase();
  
  // Check known coordinates first
  if (knownCoordinates[key]) {
    return knownCoordinates[key];
  }
  
  // Build search query
  let query = town;
  if (district && district !== '') {
    query += `, ${district}`;
  }
  if (state && state !== '') {
    query += `, ${state}`;
  }
  query += ', India';
  
  try {
    // Use Nominatim geocoding API (free, but has rate limits)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ChirayuAgencies/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const lon = parseFloat(data[0].lon);
      const lat = parseFloat(data[0].lat);
      return [lon, lat]; // [longitude, latitude] format
    }
    
    return null;
  } catch (error) {
    console.error(`Error geocoding ${query}:`, error.message);
    return null;
  }
}

// Process towns with delay to respect rate limits
async function geocodeAllTowns() {
  const towns = data.towns;
  let processed = 0;
  let geocoded = 0;
  let failed = 0;
  
  console.log(`Starting geocoding for ${towns.length} towns...`);
  console.log('This may take a while due to rate limiting...\n');
  
  for (let i = 0; i < towns.length; i++) {
    const town = towns[i];
    
    // Skip if already geocoded
    if (town.coordinates && town.coordinates[0] !== null) {
      processed++;
      geocoded++;
      continue;
    }
    
    console.log(`[${i + 1}/${towns.length}] Geocoding: ${town.name}, ${town.district}, ${town.state}`);
    
    const coordinates = await geocodeTown(town.name, town.district, town.state);
    
    if (coordinates) {
      town.coordinates = coordinates;
      geocoded++;
      console.log(`  ✓ Found: [${coordinates[0]}, ${coordinates[1]}]`);
    } else {
      town.coordinates = null;
      failed++;
      console.log(`  ✗ Not found`);
    }
    
    processed++;
    
    // Rate limiting: wait 1 second between requests (Nominatim allows 1 request per second)
    if (i < towns.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Save updated data
  fs.writeFileSync(
    dataPath,
    JSON.stringify(data, null, 2),
    'utf-8'
  );
  
  console.log(`\nGeocoding complete!`);
  console.log(`Total: ${processed}, Geocoded: ${geocoded}, Failed: ${failed}`);
  console.log(`Data saved to ${dataPath}`);
}

// Run geocoding
geocodeAllTowns().catch(console.error);
