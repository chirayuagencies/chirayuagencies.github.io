const fs = require('fs');
const path = require('path');

// Read the processed towns data
const dataPath = path.join(__dirname, '../src/data/townsData.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Extended known coordinates for major cities and towns in MP
const knownCoordinates = {
  'indore|indore|madhya pradesh': [75.8573, 22.7196],
  'bhopal|bhopal|madhya pradesh': [77.4126, 23.2599],
  'gwalior|gwalior|madhya pradesh': [78.1828, 26.2183],
  'jabalpur|jabalpur|madhya pradesh': [79.9500, 23.1815],
  'ujjain|ujjain|madhya pradesh': [75.7849, 23.1765],
  'ratlam|ratlam|madhya pradesh': [75.0364, 23.3315],
  'dewas|dewas|madhya pradesh': [76.0661, 22.9631],
  'khargone|khargone|madhya pradesh': [75.6100, 21.8200],
  'khandwa|khandwa|madhya pradesh': [76.3333, 21.7500],
  'dhar|dhar|madhya pradesh': [75.3000, 22.6000],
  'barwani|barwani|madhya pradesh': [74.9000, 22.0300],
  'burhanpur|burhanpur|madhya pradesh': [76.2300, 21.3100],
  'chhindwara|chhindwara|madhya pradesh': [78.9300, 22.0600],
  'betul|betul|madhya pradesh': [77.9000, 21.9100],
  'harda|harda|madhya pradesh': [77.1000, 22.3400],
  'narmadapuram|narmadapuram|madhya pradesh': [77.7500, 22.7500],
  'guna|guna|madhya pradesh': [77.3200, 24.6500],
  'morena|morena|madhya pradesh': [78.0000, 26.5000],
  'bhind|bhind|madhya pradesh': [78.7800, 26.5600],
  'datia|datia|madhya pradesh': [78.4600, 25.6700],
  'sagar|sagar|madhya pradesh': [78.7500, 23.8400],
  'chhatarpur|chhatarpur|madhya pradesh': [79.6000, 24.9200],
  'satna|satna|madhya pradesh': [80.8300, 24.5800],
  'rewa|rewa|madhya pradesh': [81.3000, 24.5300],
  'shahdol|shahdol|madhya pradesh': [81.3600, 23.3000],
  'katni|katni|madhya pradesh': [80.4000, 23.8400],
  'seoni|seoni|madhya pradesh': [79.5500, 22.0800],
  'balaghat|balaghat|madhya pradesh': [80.1800, 21.8000],
  'mandla|mandla|madhya pradesh': [80.3700, 22.6000],
  'dindori|dindori|madhya pradesh': [81.0800, 22.9500],
  'narsinghpur|narsinghpur|madhya pradesh': [79.1200, 22.9500],
  'raisen|raisen|madhya pradesh': [77.7900, 23.3300],
  'vidisha|vidisha|madhya pradesh': [77.8100, 23.5300],
  'sehore|sehore|madhya pradesh': [77.0800, 23.2000],
  'rajgarh|rajgarh|madhya pradesh': [76.6200, 24.0100],
  'shajapur|shajapur|madhya pradesh': [76.2600, 23.4300],
  'mandsaur|mandsaur|madhya pradesh': [75.0700, 24.0700],
  'neemuch|neemuch|madhya pradesh': [74.8700, 24.4700],
  'jhabua|jhabua|madhya pradesh': [74.5900, 22.7700],
  'alirajpur|alirajpur|madhya pradesh': [74.3600, 22.3100],
  'sheopur|sheopur|madhya pradesh': [77.7000, 25.6700],
  'shivpuri|shivpuri|madhya pradesh': [77.6500, 25.4300],
  'tikamgarh|tikamgarh|madhya pradesh': [78.8300, 24.7500],
  'damoh|damoh|madhya pradesh': [79.4400, 23.8400],
  'singrauli|singrauli|madhya pradesh': [82.6600, 24.2000],
  'sidhi|sidhi|madhya pradesh': [81.8800, 24.4200],
  'sendhwa|barwani|madhya pradesh': [75.0800, 21.6800],
  'delhi||': [77.2090, 28.6139],
  'agra||': [78.0081, 27.1767],
  'kanpur||': [80.3319, 26.4499],
  'raipur||': [81.6296, 21.2514],
  'mumbai|mumbai|maharashtra': [72.8777, 19.0760],
};

// Function to get approximate coordinates based on district/state if exact match not found
function getApproximateCoordinates(town, district, state) {
  const key = `${town}|${district}|${state}`.toLowerCase();
  
  // Check exact match first
  if (knownCoordinates[key]) {
    return knownCoordinates[key];
  }
  
  // Check district match
  if (district) {
    const districtKey = `|${district}|${state}`.toLowerCase();
    for (const [k, coords] of Object.entries(knownCoordinates)) {
      if (k.includes(districtKey)) {
        return coords;
      }
    }
  }
  
  return null;
}

// Process towns and assign coordinates
function assignCoordinates() {
  const towns = data.towns;
  let assigned = 0;
  let missing = 0;
  
  console.log(`Assigning coordinates for ${towns.length} towns...\n`);
  
  for (const town of towns) {
    if (town.coordinates && town.coordinates[0] !== null) {
      assigned++;
      continue;
    }
    
    const coords = getApproximateCoordinates(town.name, town.district, town.state);
    
    if (coords) {
      town.coordinates = coords;
      assigned++;
      console.log(`✓ ${town.name}, ${town.district}: [${coords[0]}, ${coords[1]}]`);
    } else {
      town.coordinates = null;
      missing++;
      console.log(`✗ ${town.name}, ${town.district}: Not found`);
    }
  }
  
  // Save updated data
  fs.writeFileSync(
    dataPath,
    JSON.stringify(data, null, 2),
    'utf-8'
  );
  
  console.log(`\nComplete!`);
  console.log(`Assigned: ${assigned}, Missing: ${missing}`);
  console.log(`Data saved to ${dataPath}`);
}

assignCoordinates();
