import React from 'react';
import PropTypes from 'prop-types';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const Pagination = ({ total, currentPage, pageSize, onPageChange, onPageSizeChange }) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, total);

    // Smart page window: always show first, last, and up to 3 around current
    const pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    return (
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 pb-1">
            {/* Left: entries info + page size */}
            <div className="d-flex align-items-center gap-2 text-muted fs-12">
                <span>Show</span>
                <select
                    className="form-select form-select-sm"
                    style={{ width: '70px' }}
                    value={pageSize}
                    onChange={e => onPageSizeChange(Number(e.target.value))}>
                    {PAGE_SIZE_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
                <span>
                    {total === 0
                        ? 'No entries'
                        : `Showing ${from}–${to} of ${total}`}
                </span>
            </div>

            {/* Right: page buttons */}
            <ul className="pagination pagination-separated mb-0">
                <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>
                        <i className="ri-arrow-left-s-line"></i>
                    </button>
                </li>

                {pages.map((p, i) =>
                    p === '...'
                        ? <li key={`ellipsis-${i}`} className="page-item disabled">
                            <span className="page-link">…</span>
                          </li>
                        : <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
                          </li>
                )}

                <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>
                        <i className="ri-arrow-right-s-line"></i>
                    </button>
                </li>
            </ul>
        </div>
    );
};

Pagination.propTypes = {
    total:            PropTypes.number.isRequired,
    currentPage:      PropTypes.number.isRequired,
    pageSize:         PropTypes.number.isRequired,
    onPageChange:     PropTypes.func.isRequired,
    onPageSizeChange: PropTypes.func.isRequired,
};

export default Pagination;
