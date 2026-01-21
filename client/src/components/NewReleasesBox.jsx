import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Link } from "react-router-dom";
import "../styles.css";

export default function NewReleasesBox() {
    const { authFetch } = useAuth();
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReleases();
    }, []);

    const fetchReleases = async () => {
        try {
            const data = await authFetch("/main/new-releases");
            console.log("New Releases Data:", data);
            setReleases(data.items || []);
        } catch (err) {
            console.error("Failed to fetch new releases:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Loading releases...</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>Error loading releases: {error}</div>;

    // Always render the box, even if empty, to prove it exists
    if (releases.length === 0) {
        return (
            <div className="new-releases-box" style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "30px",
                border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>🔥 New Releases</h2>
                <p>No new updates found in the last 6 hours.</p>
            </div>
        );
    }

    return (
        <div className="new-releases-box" style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "30px",
            border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                🔥 New Releases <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>(Updated every 6 hours)</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px" }}>
                {releases.map((item) => (
                    <div key={item.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        background: "rgba(0,0,0,0.3)",
                        padding: "10px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.05)"
                    }}>
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.title} style={{ width: "50px", height: "70px", objectFit: "cover", borderRadius: "6px" }} />
                        ) : (
                            <div style={{ width: "50px", height: "70px", background: "#333", borderRadius: "6px" }}></div>
                        )}
                        <div style={{ flex: 1, overflow: "hidden" }}>
                            <h3 style={{ fontSize: "1rem", margin: "0 0 5px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "none" }}>{item.title}</a>
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "#4caf50", fontWeight: "bold" }}>
                                {item.release_info}
                            </p>
                            <span style={{ fontSize: "0.7rem", color: "#aaa", textTransform: "uppercase" }}>{item.type}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
