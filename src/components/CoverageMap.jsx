import React, { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import townsData from '../data/townsData.json';
import './CoverageMap.css';

// India center coordinates [longitude, latitude]
const INDIA_CENTER = [78.9629, 20.5937];

// India GeoJSON - Complete Indian Administrative Map
// Primary source
const indiaGeoUrl = "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson";

// PoK and Aksai Chin territories - Always rendered to show complete Indian boundaries
// Coordinates based on official Indian maps
const pokTerritory = {
  type: "Feature",
  properties: { NAME: "PoK (Pakistan Occupied Kashmir)", NAME_1: "Jammu and Kashmir" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [73.0, 33.5],     // Southwest (near Muzaffarabad)
      [75.5, 33.5],     // Southeast
      [76.0, 35.5],     // Northeast (Gilgit-Baltistan region)
      [73.5, 36.5],     // North (near Skardu)
      [73.0, 35.0],     // Northwest
      [73.0, 33.5]      // Close polygon
    ]]
  }
};

const aksaiChinTerritory = {
  type: "Feature",
  properties: { NAME: "Aksai Chin (China Occupied Kashmir)", NAME_1: "Jammu and Kashmir" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [78.0, 34.5],     // Southwest (Ladakh border)
      [80.5, 34.0],     // South
      [97.0, 34.5],     // Southeast (extends to China border)
      [97.0, 35.5],     // Northeast
      [80.0, 35.5],     // Northwest (Ladakh border)
      [78.0, 35.0],     // West
      [78.0, 34.5]      // Close polygon
    ]]
  }
};

// Clustering distance threshold (in degrees) - adjust based on zoom
const getClusterDistance = (zoom) => {
  if (zoom < 1) return 2.0;      // Very zoomed out - large clusters
  if (zoom < 2) return 1.0;      // Zoomed out - medium clusters
  if (zoom < 3) return 0.5;      // Medium zoom - small clusters
  return 0.1;                     // Zoomed in - no clustering
};

// Optimized clustering algorithm - centers on town with most parties
const clusterMarkers = (towns, zoom) => {
  const distance = getClusterDistance(zoom);
  
  // If zoomed in enough, no clustering needed
  if (distance < 0.2) {
    return towns.map(town => ({
      coordinates: town.coordinates,
      partyCount: town.partyCount,
      towns: [town],
      maxPartyTown: town
    }));
  }

  const clusters = [];
  const used = new Set();

  towns.forEach((town, i) => {
    if (used.has(i)) return;

    const cluster = {
      coordinates: town.coordinates,
      partyCount: town.partyCount,
      towns: [town],
      maxPartyTown: town
    };

    // Find nearby towns to cluster
    towns.forEach((otherTown, j) => {
      if (i === j || used.has(j)) return;

      const latDiff = Math.abs(town.coordinates[1] - otherTown.coordinates[1]);
      const lonDiff = Math.abs(town.coordinates[0] - otherTown.coordinates[0]);
      const totalDiff = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

      if (totalDiff < distance) {
        cluster.partyCount += otherTown.partyCount;
        cluster.towns.push(otherTown);
        used.add(j);

        // Center on town with most parties
        if (otherTown.partyCount > cluster.maxPartyTown.partyCount) {
          cluster.maxPartyTown = otherTown;
          cluster.coordinates = otherTown.coordinates;
        }
      }
    });

    used.add(i);
    clusters.push(cluster);
  });

  return clusters;
};

const CoverageMap = () => {
  const [selectedTown, setSelectedTown] = useState(null);
  const [position, setPosition] = useState({ coordinates: INDIA_CENTER, zoom: 1 });
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter towns with valid coordinates
  const townsWithCoords = useMemo(() => {
    return townsData.towns.filter(town => 
      town.coordinates && 
      Array.isArray(town.coordinates) && 
      town.coordinates.length === 2 &&
      town.coordinates[0] !== null &&
      town.coordinates[1] !== null
    );
  }, []);

  // Cluster markers based on zoom level
  const clusteredMarkers = useMemo(() => {
    return clusterMarkers(townsWithCoords, position.zoom);
  }, [townsWithCoords, position.zoom]);

  // Get marker color based on party count - brighter, more visible colors
  const getMarkerColor = (partyCount) => {
    if (partyCount >= 20) return '#ef4444'; // red-500 - brighter
    if (partyCount >= 10) return '#f97316'; // orange-500 - brighter
    if (partyCount >= 5) return '#fbbf24'; // amber-400 - brighter
    if (partyCount >= 2) return '#facc15'; // yellow-400 - brighter
    return '#65a30d'; // lime-600 - darker for contrast
  };

  // Get marker size based on party count and zoom level
  // Size scales inversely with zoom - smaller when zoomed in
  const getMarkerSize = (partyCount, zoom = 1) => {
    // Base sizes (for zoom level 1)
    let baseSize;
    if (partyCount >= 20) baseSize = 10;
    else if (partyCount >= 10) baseSize = 8;
    else if (partyCount >= 5) baseSize = 7;
    else if (partyCount >= 2) baseSize = 6;
    else baseSize = 5;
    
    // Scale down as zoom increases (inverse relationship)
    // At zoom 1: full size, at zoom 4: half size, at zoom 8: quarter size
    const scaleFactor = 1 / Math.sqrt(zoom);
    return Math.max(3, baseSize * scaleFactor); // Minimum size of 3
  };

  const handleMarkerClick = (marker) => {
    // If it's a cluster, show the town with most parties, otherwise show the town
    if (marker.towns && marker.towns.length > 1) {
      setSelectedTown({
        ...marker.maxPartyTown,
        partyCount: marker.partyCount,
        isCluster: true,
        clusterSize: marker.towns.length
      });
    } else {
      setSelectedTown(marker.towns ? marker.towns[0] : marker);
    }
  };

  const handleMoveEnd = (position) => {
    setPosition(position);
  };

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition({ ...position, zoom: position.zoom * 1.5 });
  };

  const handleZoomOut = () => {
    if (position.zoom <= 0.3) return;
    setPosition({ ...position, zoom: position.zoom / 1.5 });
  };

  const handleReset = () => {
    setPosition({ coordinates: INDIA_CENTER, zoom: 1 });
  };

  return (
    <div className="coverage-map-container">
      <div className="coverage-map-header">
        <h1 className="text-4xl font-bold mb-4 text-center">Our Coverage</h1>
        <p className="text-center text-gray-600 mb-2">
          Explore our distribution network across {townsWithCoords.length} towns and cities
        </p>
        <p className="text-center text-xs text-gray-500 mb-6">
          Map is unable to show complete Indian administrative boundaries including all of Jammu & Kashmir due to limited software availability. 
          <br/>
          Please refer to India's official map for more information.
        </p>
      </div>

      <div className="coverage-map-wrapper">
        {!mapLoaded && (
          <div className="map-loading">
            <p>Loading map...</p>
          </div>
        )}
        <div className="map-controls">
          <button onClick={handleZoomIn} className="zoom-button" title="Zoom In">
            +
          </button>
          <button onClick={handleZoomOut} className="zoom-button" title="Zoom Out">
            −
          </button>
          <button onClick={handleReset} className="zoom-button" title="Reset View">
            ⌂
          </button>
        </div>
        <ComposableMap
          projectionConfig={{
            scale: 1200,
            center: INDIA_CENTER
          }}
          width={1200}
          height={800}
          style={{ width: '100%', height: 'auto', maxHeight: '800px' }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
          >
            {/* Main India map */}
            <Geographies 
              geography={indiaGeoUrl}
              onError={(error) => {
                console.error('Map loading error:', error);
                setMapLoaded(true);
              }}
            >
              {({ geographies }) => {
                if (!geographies || geographies.length === 0) {
                  return null;
                }
                if (!mapLoaded) setMapLoaded(true);
                return geographies.map((geo, idx) => {
                  const stateName = geo.properties?.NAME_1 || geo.properties?.ST_NM || geo.properties?.NAME || '';
                  const isJandK = stateName && (
                    stateName.toLowerCase().includes('jammu') || 
                    stateName.toLowerCase().includes('kashmir') ||
                    stateName.toLowerCase().includes('ladakh')
                  );
                  
                  return (
                    <Geography
                      key={geo.rsmKey || `${stateName}-${idx}` || Math.random()}
                      geography={geo}
                      fill={isJandK ? "#dbeafe" : "#e0e7ff"}
                      stroke="#3b82f6"
                      strokeWidth={isJandK ? 2.5 : 2}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: isJandK ? '#bfdbfe' : '#c7d2fe' },
                        pressed: { outline: 'none', fill: isJandK ? '#93c5fd' : '#a5b4fc' }
                      }}
                    />
                  );
                });
              }}
            </Geographies>

            {/* Always render PoK (Pakistan Occupied Kashmir) territory */}
            <Geography
              geography={pokTerritory}
              fill="#dbeafe"
              stroke="#1e40af"
              strokeWidth={3}
              strokeDasharray="8,4"
              style={{
                default: { outline: 'none', opacity: 0.7 },
                hover: { outline: 'none', fill: '#bfdbfe', opacity: 0.8 },
                pressed: { outline: 'none', fill: '#93c5fd' }
              }}
            />

            {/* Always render Aksai Chin (China Occupied Kashmir) territory */}
            <Geography
              geography={aksaiChinTerritory}
              fill="#dbeafe"
              stroke="#1e40af"
              strokeWidth={3}
              strokeDasharray="8,4"
              style={{
                default: { outline: 'none', opacity: 0.7 },
                hover: { outline: 'none', fill: '#bfdbfe', opacity: 0.8 },
                pressed: { outline: 'none', fill: '#93c5fd' }
              }}
            />

            {clusteredMarkers.map((marker, index) => {
              const isCluster = marker.towns && marker.towns.length > 1;
              const displayTown = marker.maxPartyTown || marker.towns?.[0] || marker;
              const displayCount = marker.partyCount || displayTown.partyCount;
              const markerSize = getMarkerSize(displayCount, position.zoom);
              
              return (
                <Marker
                  key={index}
                  coordinates={marker.coordinates}
                  onClick={() => handleMarkerClick(marker)}
                >
                  <circle
                    r={markerSize}
                    fill={getMarkerColor(displayCount)}
                    stroke="#ffffff"
                    strokeWidth={isCluster ? Math.max(2, markerSize * 0.2) : Math.max(1.5, markerSize * 0.2)}
                    style={{ 
                      cursor: 'pointer', 
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      opacity: isCluster ? 0.9 : 1
                    }}
                    className="town-marker"
                  />
                  {isCluster && markerSize > 6 && (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize={Math.max(8, Math.min(14, markerSize * 0.7))}
                      fontWeight="bold"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {marker.towns.length}
                    </text>
                  )}
                  <title>
                    {isCluster 
                      ? `${marker.towns.length} towns - ${displayCount} total parties`
                      : `${displayTown.name}, ${displayTown.district || displayTown.state || ''} - ${displayCount} parties`
                    }
                  </title>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="coverage-map-legend">
        <h3 className="text-lg font-semibold mb-3">Party Count</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#dc2626' }}></span>
            <span>20+ parties</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ea580c' }}></span>
            <span>10-19 parties</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
            <span>5-9 parties</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#eab308' }}></span>
            <span>2-4 parties</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#84cc16' }}></span>
            <span>1 party</span>
          </div>
        </div>
      </div>

      {/* Town Details Panel */}
      {selectedTown && (
        <div className="town-details-panel">
          <button
            className="close-button"
            onClick={() => setSelectedTown(null)}
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-2">{selectedTown.name}</h2>
          {selectedTown.district && (
            <p className="text-gray-600 mb-1">
              <strong>District:</strong> {selectedTown.district}
            </p>
          )}
          {selectedTown.state && (
            <p className="text-gray-600 mb-1">
              <strong>State:</strong> {selectedTown.state}
            </p>
          )}
          {selectedTown.region && (
            <p className="text-gray-600 mb-1">
              <strong>Region:</strong> {selectedTown.region}
            </p>
          )}
          {selectedTown.isCluster && (
            <p className="text-blue-600 mb-2 font-semibold">
              Cluster: {selectedTown.clusterSize} towns
            </p>
          )}
          <p className="text-lg font-semibold mt-3">
            <strong>Parties Served:</strong> {selectedTown.partyCount}
            {selectedTown.isCluster && ' (total)'}
          </p>
        </div>
      )}

      {/* Map Controls Info */}
      <div className="map-controls-info">
        <p className="text-sm text-gray-500">
          Click on markers to view details • Drag to pan • Use zoom buttons or scroll to zoom
        </p>
      </div>
    </div>
  );
};

export default CoverageMap;
