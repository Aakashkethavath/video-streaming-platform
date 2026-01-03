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
    const [previewVideo, setPreviewVideo] = useState(null); // <--- NEW: For playing video in modal

    // FILTERS
    const [filterEditor, setFilterEditor] = useState("");
    const [filterDate, setFilterDate] = useState("");
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
        } catch (err) { console.error("Admin data error", err); }
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
            if (previewVideo?._id === videoId) setPreviewVideo(null); // Close modal if deleted
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

    // --- FILTERS ---
    const filteredAdminVideos = Array.isArray(adminVideos) ? adminVideos.filter(v => {
        const editorName = v.uploader?.username?.toLowerCase() || "";
        const matchesEditor = editorName.includes(filterEditor.toLowerCase());
        const matchesDate = filterDate ? v.uploadDate?.startsWith(filterDate) : true;
        return matchesEditor && matchesDate;
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
                                <input
                                    type="text"
                                    placeholder="Filter Editor..."
                                    value={filterEditor}
                                    onChange={(e) => setFilterEditor(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px', margin: 0 }}
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                        <th style={{ padding: '10px' }}>Preview</th> {/* NEW COLUMN */}
                                        <th style={{ padding: '10px' }}>Title</th>
                                        <th style={{ padding: '10px' }}>Uploader</th>
                                        <th style={{ padding: '10px' }}>Status</th>
                                        <th style={{ padding: '10px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdminVideos.map(v => (
                                        <tr key={v._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            {/* NEW: WATCH BUTTON */}
                                            <td style={{ padding: '10px' }}>
                                                <button
                                                    onClick={() => setPreviewVideo(v)}
                                                    style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: 'var(--primary)', width: 'auto' }}
                                                >
                                                    ▶ Watch
                                                </button>
                                            </td>
                                            <td style={{ padding: '10px' }}>{v.title}</td>
                                            <td style={{ padding: '10px' }}>{v.uploader?.username || "Deleted"}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ color: v.sensitivity === 'flagged' ? 'red' : 'green', fontWeight: 'bold' }}>
                                                    {v.sensitivity?.toUpperCase()}
                                                </span>
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

            {/* --- POPUP VIDEO PLAYER (MODAL) --- */}
            {previewVideo && (
                <div className="modal-overlay" onClick={() => setPreviewVideo(null)}>

                    {/* Stop click propagation so clicking the video doesn't close modal */}
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{previewVideo.title}</h3>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                    Uploaded by: {previewVideo.uploader?.username}
                                </span>
                            </div>
                            <button className="close-btn" onClick={() => setPreviewVideo(null)}>✕</button>
                        </div>

                        {/* Video Player Area */}
                        <div className="modal-body">
                            <video
                                controls
                                autoPlay
                                style={{
                                    width: '100%',
                                    maxHeight: '70vh', /* Prevents video from being too tall on small screens */
                                    outline: 'none'
                                }}
                                src={`http://localhost:5000/api/videos/stream/${previewVideo.filename}`}
                            />
                        </div>

                        {/* Footer / Status Info */}
                        <div style={{ padding: '15px 20px', background: '#1f2937', color: 'white', borderTop: '1px solid #374151' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Current Status:</span>
                                <span style={{
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                    backgroundColor: previewVideo.sensitivity === 'safe' ? '#065f46' : '#991b1b',
                                    color: previewVideo.sensitivity === 'safe' ? '#34d399' : '#fca5a5'
                                }}>
                                    {previewVideo.sensitivity.toUpperCase()}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            )}
            {/* --- EDITOR UPLOAD --- */}
            {isEditor && !isAdmin && (
                <div className="card" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                    <VideoUpload />
                </div>
            )}
            
            {/* --- PUBLIC FEED (SEARCH + DISPLAY) --- */}
      {/* --- PUBLIC FEED & EDITOR DASHBOARD --- */}
      {!isAdmin && (
        <>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px'}}>
             <h3 style={{margin:0}}>{isEditor ? "Your Content" : "Public Feed"}</h3>
             
             <div style={{display:'flex', gap:'10px'}}>
               {/* 1. Editor Date Filter */}
               {isEditor && (
                 <input 
                   type="date"
                   value={filterDate}
                   onChange={(e) => setFilterDate(e.target.value)}
                   style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', margin: 0 }}
                 />
               )}

               {/* 2. Viewer Search Bar */}
               {!isEditor && (
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
            {/* 3. Filter Logic */}
            {videos.filter(video => {
               // Date Filter (For Editors)
               if (filterDate && !video.uploadDate.startsWith(filterDate)) {
                 return false; 
               }
               
               // Search Filter (For Viewers)
               if (!isEditor) {
                 const search = filterEditor.toLowerCase();
                 const titleMatch = video.title.toLowerCase().includes(search);
                 const uploaderMatch = video.uploader?.username?.toLowerCase().includes(search) || false;
                 return titleMatch || uploaderMatch;
               }
               
               return true;
            }).map((video) => (
              <div key={video._id} className="video-card">
                
                <div style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '16/9' }}>
                  {video.status === 'completed' && video.sensitivity !== 'flagged' ? (
                    <video controls width="100%" height="100%" src={`http://localhost:5000/api/videos/stream/${video.filename}`} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column' }}>
                      <span style={{fontSize: '2rem'}}>{video.sensitivity === 'flagged' ? '⚠️' : '⚙️'}</span>
                      <p>{video.sensitivity === 'flagged' ? 'Sensitive' : 'Processing...'}</p>
                    </div>
                  )}
                </div>

                <div style={{marginTop: '10px'}}>
                  <h4 style={{fontSize: '1.1rem', marginBottom: '5px', fontWeight: '600'}}>{video.title}</h4>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {!isEditor && (
                        <p style={{fontSize: '0.85rem', color: '#6b7280'}}>
                        By: {video.uploader ? video.uploader.username : "Unknown"}
                        </p>
                    )}
                    {/* Show Date */}
                    <p style={{fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto'}}>
                        {new Date(video.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {videos.length === 0 && (
             <p style={{textAlign:'center', padding:'40px', color:'#9ca3af'}}>No videos found.</p>
          )}
        </>
      )}
        </div>
    );
};

export default Dashboard;