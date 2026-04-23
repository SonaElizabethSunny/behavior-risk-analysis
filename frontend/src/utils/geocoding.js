/**
 * Reverse Geocoding Utility
 * Converts GPS coordinates to human-readable addresses
 */

// Cache for geocoded addresses to avoid repeated API calls
const geocodeCache = new Map();

/**
 * Convert GPS coordinates to address using OpenStreetMap Nominatim API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} - Formatted address
 */
export async function reverseGeocode(lat, lon) {
    // Check cache first
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey);
    }

    try {
        // Use OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'SentinelAI-BehaviorRiskAnalysis/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();

        // Format address from components
        const address = formatAddress(data.address);

        // Cache the result
        geocodeCache.set(cacheKey, address);

        return address;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Fallback to coordinates
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
}

/**
 * Format address from Nominatim response
 * @param {object} addressComponents - Address components from API
 * @returns {string} - Formatted address
 */
function formatAddress(addressComponents) {
    if (!addressComponents) {
        return 'Unknown Location';
    }

    const parts = [];

    // Building/House number and road
    if (addressComponents.house_number && addressComponents.road) {
        parts.push(`${addressComponents.house_number} ${addressComponents.road}`);
    } else if (addressComponents.road) {
        parts.push(addressComponents.road);
    } else if (addressComponents.pedestrian) {
        parts.push(addressComponents.pedestrian);
    }

    // Neighborhood/Suburb
    if (addressComponents.neighbourhood) {
        parts.push(addressComponents.neighbourhood);
    } else if (addressComponents.suburb) {
        parts.push(addressComponents.suburb);
    }

    // City
    if (addressComponents.city) {
        parts.push(addressComponents.city);
    } else if (addressComponents.town) {
        parts.push(addressComponents.town);
    } else if (addressComponents.village) {
        parts.push(addressComponents.village);
    }

    // State/Province
    if (addressComponents.state) {
        parts.push(addressComponents.state);
    }

    // Country
    if (addressComponents.country) {
        parts.push(addressComponents.country);
    }

    // If we have parts, join them
    if (parts.length > 0) {
        return parts.join(', ');
    }

    // Fallback to display_name if available
    if (addressComponents.display_name) {
        return addressComponents.display_name;
    }

    return 'Unknown Location';
}

/**
 * Get short address (just main location)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} - Short address
 */
export async function getShortAddress(lat, lon) {
    const cacheKey = `short_${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'SentinelAI-BehaviorRiskAnalysis/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();
        const addr = data.address;

        // Short format: "Road, City" or "Neighborhood, City"
        const parts = [];

        if (addr.road) {
            parts.push(addr.road);
        } else if (addr.neighbourhood) {
            parts.push(addr.neighbourhood);
        } else if (addr.suburb) {
            parts.push(addr.suburb);
        }

        if (addr.city) {
            parts.push(addr.city);
        } else if (addr.town) {
            parts.push(addr.town);
        }

        const shortAddr = parts.length > 0 ? parts.join(', ') : 'Unknown Location';

        geocodeCache.set(cacheKey, shortAddr);
        return shortAddr;
    } catch (error) {
        console.error('Short address error:', error);
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
}

/**
 * Clear geocode cache (useful for memory management)
 */
export function clearGeocodeCache() {
    geocodeCache.clear();
    console.log('Geocode cache cleared');
}

/**
 * Get cache size
 */
export function getGeocacheCacheSize() {
    return geocodeCache.size;
}

export default {
    reverseGeocode,
    getShortAddress,
    clearGeocodeCache,
    getGeocacheCacheSize
};
