import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import './SearchFilter.css';

const SearchFilter = ({ onSearch, onFilter, totalResults }) => {
    const [filters, setFilters] = useState({
        riskLevel: 'all',
        status: 'all',
        dateRange: 'all'
    });

    // Internal state for immediate feedback
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    // Debounce the search term prop update (300ms delay)
    // This returns a memoized function that we can call with new values
    const debouncedSearch = useDebounce(onSearch, 300);

    const handleSearch = (e) => {
        const value = e.target.value;
        setLocalSearchTerm(value);
        debouncedSearch(value);
    };

    const handleFilterChange = (filterType, value) => {
        const newFilters = { ...filters, [filterType]: value };
        setFilters(newFilters);
        onFilter(newFilters);
    };

    const clearFilters = () => {
        setLocalSearchTerm('');

        const resetFilters = {
            riskLevel: 'all',
            status: 'all',
            dateRange: 'all'
        };

        setFilters(resetFilters);

        // Clear parent search and filters immediately
        onSearch('');
        onFilter(resetFilters);
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length + (localSearchTerm ? 1 : 0);

    return (
        <div className="search-filter-container glass-panel">
            <div className="search-row">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search behavior, location, video..."
                        value={localSearchTerm}
                        onChange={handleSearch}
                    />
                    {localSearchTerm && (
                        <button
                            className="clear-search-btn"
                            onClick={() => {
                                setLocalSearchTerm('');
                                onSearch('');
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">
                        <span className="filter-icon">⚠️</span>
                        Risk Level
                    </label>
                    <select
                        className="filter-select"
                        value={filters.riskLevel}
                        onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                    >
                        <option value="all">All Levels</option>
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">
                        <span className="filter-icon">📋</span>
                        Status
                    </label>
                    <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Verified">Verified</option>
                        <option value="Reported">Reported</option>
                        <option value="Resolved">Resolved</option>
                        <option value="False Alarm">False Alarm</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">
                        <span className="filter-icon">📅</span>
                        Date Range
                    </label>
                    <select
                        className="filter-select"
                        value={filters.dateRange}
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>

                {activeFilterCount > 0 && (
                    <button className="clear-filters-btn" onClick={clearFilters}>
                        <span className="filter-badge">{activeFilterCount}</span>
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchFilter;
