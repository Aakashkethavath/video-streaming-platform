import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { socket } from "../socket";
import toast from "react-hot-toast";

const VideoUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(""); // processing, completed, etc.
  const [sensitivity, setSensitivity] = useState(""); // safe, flagged
  const { token } = useContext(AuthContext);

  // Listen for updates from the server
  // Listen for updates from the server
  useEffect(() => {
    socket.on("videoProgress", (data) => {
      setProgress(data.progress);
      setStatus(data.status);
      if (data.sensitivity) {
        setSensitivity(data.sensitivity);
      }

      // --- NEW: AUTO-RESET LOGIC ---
      if (data.status === "completed") {
        setTimeout(() => {
          resetForm();
          // Optional: Refresh the page to show the new video in the list
          window.location.reload();
        }, 3000); // 3 seconds delay
      }
    });

    // Cleanup listener when component closes
    return () => socket.off("videoProgress");
  }, []);
  // Helper to clear all states
  const resetForm = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setStatus("");
    setSensitivity("");

    // Crucial: Clear the actual file input in the HTML
    const fileInput = document.getElementById("videoInput");
    if (fileInput) fileInput.value = "";
  };
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);
    const toastId = toast.loading("Starting upload...");
    try {
      setUploading(true);
      setProgress(0);
      setStatus("Uploading...");

      // Send file to Backend
      await axios.post("https://video-streaming-platform-99n4.onrender.com/api/videos/upload", formData, {
        headers: {
          "Authorization": token, // Send our login token
          //"Content-Type": "multipart/form-data",
        },
      });
      toast.dismiss(toastId);
      toast.success("Upload started!");
      // Note: We don't stop 'uploading' here because we are waiting for socket updates
    } catch (err) {
      console.error(err);
      setUploading(false);
      toast.dismiss(toastId);
      const errorMsg = err.response?.data?.message || "Upload failed";
      toast.error(errorMsg);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px", marginTop: "20px" }}>
      <h3>Upload Video</h3>
      <form onSubmit={handleUpload}>
        <input id="videoInput" type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" disabled={uploading || !file}>
          {uploading ? "Processing..." : "Upload"}
        </button>
      </form>

      {/* Progress Bar Display */}
      {(uploading || progress > 0) && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ marginBottom: '5px', fontWeight: '500' }}>Status: <strong>{status}</strong></p>

          {/* Modern Progress Bar (Uses CSS classes now) */}
          <div className="progress-container">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                // Turn red if flagged, otherwise use the Theme color
                backgroundColor: sensitivity === "flagged" ? "var(--danger)" : "var(--primary)"
              }}
            />
          </div>
          <p style={{ textAlign: 'right', fontSize: '0.85rem', color: '#6b7280', marginTop: '5px' }}>
            {progress}%
          </p>

          {/* Final Result Box */}
          {status === "completed" && (
            <div style={{
              marginTop: "15px",
              padding: "15px",
              borderRadius: "8px",
              backgroundColor: sensitivity === "safe" ? "#ecfdf5" : "#fef2f2",
              color: sensitivity === "safe" ? "#065f46" : "#991b1b",
              border: `1px solid ${sensitivity === "safe" ? "#10b981" : "#ef4444"}`
            }}>
              <h4 style={{ margin: 0 }}>Result: {sensitivity.toUpperCase()}</h4>
              <p style={{ margin: "5px 0 0 0" }}>
                {sensitivity === "safe" ? "✅ This video is safe for viewing." : "❌ Sensitive content detected. Video has been hidden."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoUpload;