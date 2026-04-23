import React from 'react';
import './Pagination.css';

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange
}) => {
    const pages = [];
    const maxVisiblePages = 5;

    // Calculate page range to display
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Showing {startItem}-{endItem} of {totalItems} alerts
            </div>

            <div className="pagination-controls">
                {/* First Page */}
                <button
                    className="pagination-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentPage > 1) {
                            onPageChange(1);
                        }
                    }}
                    disabled={currentPage === 1}
                    title="First Page"
                >
                    ⟨⟨
                </button>

                {/* Previous Page */}
                <button
                    className="pagination-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentPage > 1) {
                            onPageChange(currentPage - 1);
                        }
                    }}
                    disabled={currentPage === 1}
                    title="Previous Page"
                >
                    ⟨
                </button>

                {/* Page Numbers */}
                {startPage > 1 && (
                    <>
                        <button
                            className="pagination-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onPageChange(1);
                            }}
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}

                {pages.map(page => (
                    <button
                        key={page}
                        className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onPageChange(page);
                        }}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                        <button
                            className="pagination-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onPageChange(totalPages);
                            }}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                {/* Next Page */}
                <button
                    className="pagination-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentPage < totalPages) {
                            onPageChange(currentPage + 1);
                        }
                    }}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                >
                    ⟩
                </button>

                {/* Last Page */}
                <button
                    className="pagination-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentPage < totalPages) {
                            onPageChange(totalPages);
                        }
                    }}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                >
                    ⟩⟩
                </button>
            </div>

            <div className="pagination-per-page">
                <label>
                    Show:
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="per-page-select"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    per page
                </label>
            </div>
        </div>
    );
};

export default Pagination;
