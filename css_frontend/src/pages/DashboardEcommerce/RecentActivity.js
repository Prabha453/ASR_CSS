import React, { useEffect, useState, useCallback } from "react";
import { Card, CardBody, Spinner } from "reactstrap";
import SimpleBar from "simplebar-react";
import { getDashboardRecentActivity } from "../../helpers/backend_helper";

// ── Action → human-readable label ──────────────────────────────────────────
const ACTION_LABELS = {
    LOGIN:              "Logged In",
    LOGOUT:             "Logged Out",
    CHANGE_PASSWORD:    "Changed Password",
    RESET_PASSWORD:     "Reset Password",
    REFRESH_TOKEN:      "Token Refreshed",
    CREATE:             "Created Record",
    VIEW:               "Viewed Record",
    UPDATE:             "Updated Record",
    DELETE:             "Deleted Record",
    RESTORE:            "Restored Record",
    CREATE_COMPANY:     "Company Created",
    UPDATE_COMPANY:     "Company Updated",
    DELETE_COMPANY:     "Company Deleted",
    ADD_DIRECTOR:       "Director Added",
    REMOVE_DIRECTOR:    "Director Removed",
    ADD_SHAREHOLDER:    "Shareholder Added",
    REMOVE_SHAREHOLDER: "Shareholder Removed",
    FILE_AGM:           "AGM Filed",
    FILE_AR:            "AR Filed",
    FILE_CEI:           "CEI Filed",
    UPLOAD_DOCUMENT:    "Document Uploaded",
    DELETE_DOCUMENT:    "Document Deleted",
    DOWNLOAD_DOCUMENT:  "Document Downloaded",
    CREATE_USER:        "User Created",
    UPDATE_USER:        "User Updated",
    SUSPEND_USER:       "User Suspended",
    ACTIVATE_USER:      "User Activated",
};

// ── Module → Remix icon class ───────────────────────────────────────────────
const MODULE_ICONS = {
    AUTH:        "ri-shield-user-line",
    COMPANY:     "ri-building-2-line",
    INDIVIDUAL:  "ri-user-line",
    SHAREHOLDER: "ri-stock-line",
    DIRECTOR:    "ri-briefcase-line",
    SECRETARY:   "ri-user-star-line",
    DOCUMENT:    "ri-file-text-line",
    USER:        "ri-user-settings-line",
    SETTINGS:    "ri-settings-3-line",
    REPORT:      "ri-bar-chart-2-line",
    FORMS:       "ri-draft-line",
    TEMPLATE:    "ri-layout-line",
    SYSTEM:      "ri-cpu-line",
};

// ── Module → badge color classes ────────────────────────────────────────────
const MODULE_COLORS = {
    AUTH:        { bg: "bg-primary-subtle",   text: "text-primary"   },
    COMPANY:     { bg: "bg-success-subtle",   text: "text-success"   },
    INDIVIDUAL:  { bg: "bg-info-subtle",      text: "text-info"      },
    SHAREHOLDER: { bg: "bg-warning-subtle",   text: "text-warning"   },
    DIRECTOR:    { bg: "bg-secondary-subtle", text: "text-secondary" },
    DOCUMENT:    { bg: "bg-danger-subtle",    text: "text-danger"    },
    USER:        { bg: "bg-primary-subtle",   text: "text-primary"   },
    SETTINGS:    { bg: "bg-secondary-subtle", text: "text-secondary" },
    DEFAULT:     { bg: "bg-light",            text: "text-muted"     },
};

// ── Relative-time formatter ──────────────────────────────────────────────────
const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = now - d; // ms

    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    const pad = (n) => String(n).padStart(2, "0");
    const timeStr = `${d.getHours() % 12 || 12}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? "PM" : "AM"}`;

    const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

    if (mins < 1)       return "Just now";
    if (mins < 60)      return `${mins}m ago`;
    if (hours < 24 && isToday) return `${timeStr} Today`;
    if (isYesterday)    return `${timeStr} Yesterday`;

    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}, ${d.getFullYear()}`;
};

// ── Avatar: photo → img, else coloured initial ──────────────────────────────
const UserAvatar = ({ user }) => {
    const name = user?.user_name || user?.first_name || "?";
    const initial = name.charAt(0).toUpperCase();

    if (user?.profile_photo_url) {
        return (
            <img
                src={user.profile_photo_url}
                alt={name}
                className="avatar-xs rounded-circle acitivity-avatar"
            />
        );
    }

    const colors = ["#2ecc71", "#3498db", "#9b59b6", "#e67e22", "#e74c3c", "#1abc9c", "#f39c12"];
    const bg     = colors[(name.charCodeAt(0) || 0) % colors.length];

    return (
        <div
            className="avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
            style={{ background: bg, fontSize: 13 }}
        >
            {initial}
        </div>
    );
};

// ── Single timeline row ──────────────────────────────────────────────────────
const ActivityItem = ({ log }) => {
    const module  = log.module  || "DEFAULT";
    const action  = log.action  || "";
    const label   = ACTION_LABELS[action] || action.replace(/_/g, " ");
    const { bg, text } = MODULE_COLORS[module] || MODULE_COLORS.DEFAULT;
    const icon    = MODULE_ICONS[module]   || "ri-information-line";
    const isFailed = log.status === "FAILED";
    const hasUser  = !!log.user;

    return (
        <div className="acitivity-item py-2 d-flex align-items-start">
            {/* Avatar */}
            <div className="flex-shrink-0 acitivity-avatar me-3">
                {hasUser ? (
                    <UserAvatar user={log.user} />
                ) : (
                    <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center ${bg}`}>
                        <i className={`${icon} ${text} fs-14`}></i>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 className="mb-0 text-truncate" style={{ maxWidth: 145 }}>
                        {hasUser
                            ? (log.user.user_name || `${log.user.first_name} ${log.user.last_name}`)
                            : "System"}
                    </h6>
                    {isFailed && (
                        <span className="badge bg-danger-subtle text-danger" style={{ fontSize: 10 }}>
                            Failed
                        </span>
                    )}
                </div>

                <div className="d-flex align-items-center gap-1 mb-1">
                    <span className={`badge ${bg} ${text}`} style={{ fontSize: 10, fontWeight: 500 }}>
                        <i className={`${icon} me-1`}></i>
                        {module}
                    </span>
                    <small className="text-muted text-truncate">{label}</small>
                </div>

                <small className="text-muted d-flex align-items-center gap-1">
                    <i className="ri-time-line"></i>
                    {formatTime(log.created_at)}
                </small>
            </div>
        </div>
    );
};

// ── Main component ──────────────────────────────────────────────────────────
const RecentActivity = ({ rightColumn, hideRightColumn }) => {
    const [logs,    setLogs]    = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getDashboardRecentActivity(25);
            setLogs(Array.isArray(res?.data) ? res.data : []);
        } catch {
            setError("Failed to load activity.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on open; refresh every 60 s while panel is open
    useEffect(() => {
        if (!rightColumn) return;
        fetchLogs();
        const timer = setInterval(fetchLogs, 60000);
        return () => clearInterval(timer);
    }, [rightColumn, fetchLogs]);

    return (
        <div
            className={rightColumn
                ? "col-auto layout-rightside-col d-block"
                : "col-auto layout-rightside-col d-none"}
            id="layout-rightside-coll"
        >
            <div className="overlay" onClick={hideRightColumn}></div>
            <div className="layout-rightside">
                <Card className="h-100 rounded-0 border-0">
                    <CardBody className="p-0">
                        {/* Header */}
                        <div className="p-3 d-flex align-items-center justify-content-between border-bottom">
                            <h6 className="text-muted mb-0 text-uppercase fw-semibold">
                                Recent Activity
                            </h6>
                            <div className="d-flex align-items-center gap-2">
                                {loading && <Spinner size="sm" color="primary" />}
                                <button
                                    className="btn btn-sm btn-ghost-secondary p-1"
                                    onClick={fetchLogs}
                                    title="Refresh"
                                    style={{ lineHeight: 1 }}
                                >
                                    <i className="ri-refresh-line fs-14"></i>
                                </button>
                            </div>
                        </div>

                        {/* Timeline */}
                        <SimpleBar style={{ maxHeight: "calc(100vh - 120px)" }} className="p-3">
                            {error && (
                                <div className="text-center text-danger py-4">
                                    <i className="ri-error-warning-line fs-20 d-block mb-1"></i>
                                    <small>{error}</small>
                                </div>
                            )}

                            {!loading && !error && logs.length === 0 && (
                                <div className="text-center text-muted py-5">
                                    <i className="ri-history-line fs-24 d-block mb-2 opacity-50"></i>
                                    <small>No recent activity</small>
                                </div>
                            )}

                            <div className="acitivity-timeline acitivity-main">
                                {logs.map((log) => (
                                    <ActivityItem key={log.id} log={log} />
                                ))}
                            </div>
                        </SimpleBar>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default RecentActivity;
