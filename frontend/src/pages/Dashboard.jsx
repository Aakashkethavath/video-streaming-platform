import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import VideoUpload from "../components/VideoUpload";
import axios from "axios";
import toast from "react-hot-toast";

const Dashboard = () => {
    const { user, logout, token } = useContext(AuthContext);

    // DATA STATES
    const [videos, setVideos] = useState([]);
    const [users, setUsers] = useState([]);
    const [adminVideos, setAdminVideos] = useState([]);
    const [previewVideo, setPreviewVideo] = useState(null);

    // FILTERS
    const [filterEditor, setFilterEditor] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterSize, setFilterSize] = useState("all"); //  Size Filter
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterUserSearch, setFilterUserSearch] = useState("");
    const [filterUserRole, setFilterUserRole] = useState("all");

    const isEditor = user?.role === 'editor' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';

    // --- FETCHING DATA ---
    const fetchVideos = async () => {
        try {
            const endpoint = isEditor
                ? "http://localhost:5000/api/videos/my-videos"
                : "http://localhost:5000/api/videos/feed";
            const res = await axios.get(endpoint, { headers: { Authorization: token } });
            if (Array.isArray(res.data)) setVideos(res.data);
        } catch (err) { console.error("Video fetch error", err); }
    };

    const fetchAdminData = async () => {
        if (!isAdmin) return;
        try {
            const userRes = await axios.get("http://localhost:5000/api/auth/users", { headers: { Authorization: token } });
            if (Array.isArray(userRes.data)) setUsers(userRes.data);

            const videoRes = await axios.get("http://localhost:5000/api/videos/admin/all", { headers: { Authorization: token } });
            if (Array.isArray(videoRes.data)) setAdminVideos(videoRes.data);
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                toast.error("Session expired.");
                logout();
            }
        }
    };

    useEffect(() => {
        fetchVideos();
        if (isAdmin) fetchAdminData();
        const interval = setInterval(() => {
            fetchVideos();
            if (isAdmin) fetchAdminData();
        }, 5000);
        return () => clearInterval(interval);
    }, [token, isEditor, isAdmin]);

    // --- ACTIONS ---
    const handleBlockVideo = async (videoId) => {
        try {
            await axios.put(`http://localhost:5000/api/videos/${videoId}/block`, {}, { headers: { Authorization: token } });
            toast.success("Video blocked");
            fetchAdminData();
        } catch (err) { toast.error("Failed to block"); }
    };

    const handleUnblockVideo = async (videoId) => {
        try {
            await axios.put(`http://localhost:5000/api/videos/${videoId}/unblock`, {}, { headers: { Authorization: token } });
            toast.success("Video unblocked");
            fetchAdminData();
        } catch (err) { toast.error("Failed to unblock"); }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm("Delete permanently?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/videos/${videoId}`, { headers: { Authorization: token } });
            toast.success("Video deleted");
            fetchAdminData();
            fetchVideos();
            if (previewVideo?._id === videoId) setPreviewVideo(null);
        } catch (err) { toast.error("Failed to delete"); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Delete User?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/auth/users/${userId}`, { headers: { Authorization: token } });
            toast.success("User deleted");
            fetchAdminData();
        } catch (err) { toast.error("Failed to delete user"); }
    };

    // --- HELPER: FORMAT BYTES TO MB ---
    const formatSize = (bytes) => {
        if (!bytes) return "N/A";
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + " MB";
    };

    // --- FILTER LOGIC (ADMIN) ---
    const filteredAdminVideos = Array.isArray(adminVideos) ? adminVideos.filter(v => {
        // 1. Editor Name Filter
        const editorName = v.uploader?.username?.toLowerCase() || "";
        const matchesEditor = editorName.includes(filterEditor.toLowerCase());

        // 2. Date Filter
        const matchesDate = filterDate ? v.uploadDate?.startsWith(filterDate) : true;

        // 3. Size Filter
        let matchesSize = true;
        const sizeMB = v.size ? v.size / (1024 * 1024) : 0;
        if (filterSize === "small") matchesSize = sizeMB < 10;
        if (filterSize === "medium") matchesSize = sizeMB >= 10 && sizeMB < 50;
        if (filterSize === "large") matchesSize = sizeMB >= 50;

        // 4. Status Filter 
        const matchesStatus = filterStatus === "all" || v.sensitivity === filterStatus;

        return matchesEditor && matchesDate && matchesSize && matchesStatus;
    }) : [];

    const filteredUsers = Array.isArray(users) ? users.filter(u => {
        const searchLower = filterUserSearch.toLowerCase();
        const username = u.username?.toLowerCase() || "";
        const email = u.email?.toLowerCase() || "";
        const matchesSearch = username.includes(searchLower) || email.includes(searchLower);
        const matchesRole = filterUserRole === "all" || u.role === filterUserRole;
        return matchesSearch && matchesRole;
    }) : [];

    return (
        <div className="container">
            <header>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {isAdmin ? "Admin Dashboard" : (isEditor ? "Creator Studio" : "Video Feed")}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Logged in as: <strong>{user?.username || "User"}</strong> ({user?.role || "viewer"})
                    </p>
                </div>
                <button className="btn-logout" onClick={logout}>Sign Out</button>
            </header>

            {/* --- ADMIN PANEL --- */}
            {isAdmin && (
                <>
                    {/* USER MANAGEMENT */}
                    <div className="card" style={{ maxWidth: '100%', marginBottom: '2rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <h3>User Management</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Search User..."
                                    value={filterUserSearch}
                                    onChange={(e) => setFilterUserSearch(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '200px', margin: 0 }}
                                />
                                <select
                                    value={filterUserRole}
                                    onChange={(e) => setFilterUserRole(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', margin: 0 }}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        {/* ... User Table (Same as before) ... */}
                        <div style={{ overflowX: 'auto', marginTop: '1rem', marginBottom: '2rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                        <th style={{ padding: '10px' }}>Username</th>
                                        <th style={{ padding: '10px' }}>Email</th>
                                        <th style={{ padding: '10px' }}>Role</th>
                                        <th style={{ padding: '10px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '10px' }}>{u.username}</td>
                                            <td style={{ padding: '10px' }}>{u.email}</td>
                                            <td style={{ padding: '10px' }}>{u.role}</td>
                                            <td style={{ padding: '10px' }}>
                                                {u.role !== 'admin' && (
                                                    <button onClick={() => handleDeleteUser(u._id)} style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: 'var(--danger)', width: 'auto' }}>Delete</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* VIDEO MODERATION */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <h3>Video Moderation</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {/* 1. Filter by Editor Name */}
                                <input
                                    type="text"
                                    placeholder="Filter Editor..."
                                    value={filterEditor}
                                    onChange={(e) => setFilterEditor(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px', margin: 0 }}
                                />

                                {/* 2. Filter by Size */}
                                <select
                                    value={filterSize}
                                    onChange={(e) => setFilterSize(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', margin: 0 }}
                                >
                                    <option value="all">All Sizes</option>
                                    <option value="small">Small (&lt;10MB)</option>
                                    <option value="medium">Medium (10-50MB)</option>
                                    <option value="large">Large (&gt;50MB)</option>
                                </select>

                                {/* 3. Filter by Date */}
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', margin: 0 }}
                                />


                                {/* Status Filter (Safe/Flagged) */}
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', margin: 0 }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="safe">✅ Safe</option>
                                    <option value="flagged">🚩 Flagged</option>
                                </select>
                                {(filterEditor || filterDate || filterSize !== "all" || filterStatus !== "all") && (
                                    <button
                                        onClick={() => {
                                            setFilterEditor("");
                                            setFilterDate("");
                                            setFilterSize("all");
                                            setFilterStatus("all"); // <--- Add this reset
                                        }}
                                        style={{ padding: '8px', backgroundColor: '#6b7280', width: 'auto' }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                        <th style={{ padding: '10px' }}>Preview</th>
                                        <th style={{ padding: '10px' }}>Title</th>
                                        <th style={{ padding: '10px' }}>Uploader</th>
                                        <th style={{ padding: '10px' }}>Size</th> {/* NEW COLUMN */}
                                        <th style={{ padding: '10px' }}>Date</th>
                                        <th style={{ padding: '10px' }}>Status</th>
                                        <th style={{ padding: '10px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdminVideos.map(v => (
                                        <tr key={v._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '10px' }}>
                                                <button onClick={() => setPreviewVideo(v)} style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: 'var(--primary)', width: 'auto' }}>▶ Watch</button>
                                            </td>
                                            <td style={{ padding: '10px' }}>{v.title}</td>
                                            <td style={{ padding: '10px' }}>{v.uploader?.username || "Deleted"}</td>
                                            <td style={{ padding: '10px', fontSize: '0.85rem' }}>{formatSize(v.size)}</td> {/* SHOW SIZE */}
                                            <td style={{ padding: '10px', fontSize: '0.85rem' }}>{v.uploadDate ? new Date(v.uploadDate).toLocaleDateString() : '-'}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ color: v.sensitivity === 'flagged' ? 'red' : 'green', fontWeight: 'bold' }}>{v.sensitivity?.toUpperCase()}</span>
                                            </td>
                                            <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                                                {v.sensitivity === 'flagged' ? (
                                                    <button onClick={() => handleUnblockVideo(v._id)} style={{ padding: '5px', fontSize: '0.8rem', backgroundColor: '#10b981', width: 'auto' }}>Unblock</button>
                                                ) : (
                                                    <button onClick={() => handleBlockVideo(v._id)} style={{ padding: '5px', fontSize: '0.8rem', backgroundColor: '#f59e0b', width: 'auto' }}>Block</button>
                                                )}
                                                <button onClick={() => handleDeleteVideo(v._id)} style={{ padding: '5px', fontSize: '0.8rem', backgroundColor: 'var(--danger)', width: 'auto' }}>Del</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* --- POPUP VIDEO PLAYER --- */}
            {previewVideo && (
                <div className="modal-overlay" onClick={() => setPreviewVideo(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{previewVideo.title}</h3>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                    Uploaded by: {previewVideo.uploader?.username} • Size: {formatSize(previewVideo.size)}
                                </span>
                            </div>
                            <button className="close-btn" onClick={() => setPreviewVideo(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <video controls autoPlay style={{ width: '100%', maxHeight: '70vh', outline: 'none' }} src={`http://localhost:5000/api/videos/stream/${previewVideo.filename}`} />
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDITOR & PUBLIC FEED --- */}
            {!isAdmin && (
                <>
                    {isEditor && (
                        <div className="card" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                            <VideoUpload />
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ margin: 0 }}>{isEditor ? "Your Content" : "Public Feed"}</h3>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            {isEditor ? (
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', margin: 0 }}
                                />
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={filterEditor}
                                    onChange={(e) => setFilterEditor(e.target.value)}
                                    style={{ padding: '10px', width: '200px', borderRadius: '20px', border: '1px solid #ccc', margin: 0 }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="grid-layout">
                        {videos.filter(video => {
                            if (isEditor && filterDate && !video.uploadDate.startsWith(filterDate)) return false;
                            if (!isEditor) {
                                const search = filterEditor.toLowerCase();
                                return video.title.toLowerCase().includes(search) || video.uploader?.username?.toLowerCase().includes(search);
                            }
                            return true;
                        }).map((video) => (
                            <div key={video._id} className="video-card">
                                {/* VIDEO THUMBNAIL CARD */}
                                <div
                                    onClick={() => {
                                        // Only open player if video is ready and safe
                                        if (video.status === 'completed' && (video.sensitivity !== 'flagged' || isEditor)) {
                                            setPreviewVideo(video);
                                        }
                                    }}
                                    style={{
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        backgroundColor: '#000',
                                        aspectRatio: '16/9',
                                        position: 'relative',
                                        cursor: (video.status === 'completed' && video.sensitivity !== 'flagged') ? 'pointer' : 'default'
                                    }}
                                >
                                    {video.status === 'completed' && video.sensitivity !== 'flagged' ? (
                                        <>
                                            {/* 1. Static Video Preview (Acts as thumbnail) */}
                                            <video
                                                src={`http://localhost:5000/api/videos/stream/${video.filename}#t=1.0`}
                                                preload="metadata"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />

                                            {/* 2. Play Button Overlay (Matches Admin feel) */}
                                            <div className="play-overlay" style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: 'rgba(0,0,0,0.15)',
                                                transition: 'background 0.3s'
                                            }}>
                                                <div style={{
                                                    width: '50px', height: '50px', backgroundColor: 'rgba(0,0,0,0.7)',
                                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontSize: '1.5rem', paddingLeft: '4px',
                                                    border: '2px solid rgba(255,255,255,0.8)'
                                                }}>
                                                    ▶
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        // PROCESSING / FLAGGED STATE (Keep this as is)
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '2rem' }}>{video.sensitivity === 'flagged' ? '⚠️' : '⚙️'}</span>
                                            <p>{video.sensitivity === 'flagged' ? 'Sensitive Content' : 'Processing...'}</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '5px', fontWeight: '600' }}>{video.title}</h4>

                                    {video.description && (
                                        <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '8px' }}>
                                            {video.description.length > 60 ? video.description.substring(0, 60) + "..." : video.description}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {!isEditor && <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>By: {video.uploader ? video.uploader.username : "Unknown"}</p>}
                                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>{new Date(video.uploadDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;