import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Star, Calendar, BookOpen, Tv, Heart, Trash2 } from "lucide-react";
import "./ItemDetailsPage.css";

// Helper to sanitize HTML description from Anilist/Jikan
const stripHtml = (html) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
};

export default function ItemDetailsPage() {
    const { type, id } = useParams();
    const { token, authFetch } = useAuth(); // Use authFetch for authenticated requests
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subLoading, setSubLoading] = useState(false);

    // Fetch Item Details and Subscription Status
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch from Jikan (Public API, use axios directly)
                const jikanRes = await axios.get(`https://api.jikan.moe/v4/${type}/${id}`);
                const data = jikanRes.data.data;
                setItem(data);

                // 2. Check Subscription Status (Private API, use authFetch)
                if (token) {
                    try {
                        const subRes = await authFetch("/sub");
                        // Check if any subscription matches this item's title AND type
                        // Note: Jikan titles might vary slightly, but we use the Main title for consistency
                        const found = subRes.subscriptions.find(
                            (sub) =>
                                sub.item.title.toLowerCase() === data.title.toLowerCase() &&
                                sub.item.type === type
                        );
                        setIsSubscribed(!!found);
                    } catch (subErr) {
                        console.error("Error checking subscription status", subErr);
                    }
                }
            } catch (err) {
                console.error("Error fetching details:", err);
                setError("Failed to load details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (type && id) {
            fetchData();
        }
    }, [type, id, token, authFetch]);

    const handleSubscribe = async () => {
        if (!item) return;
        setSubLoading(true);
        try {
            await authFetch("/sub", {
                method: "POST",
                body: JSON.stringify({
                    title: item.title,
                    type: type, // "anime" or "manga"
                    description: item.synopsis ? stripHtml(item.synopsis) : "",
                }),
            });
            setIsSubscribed(true);
        } catch (err) {
            console.error("Subscribe failed:", err);
            alert("Failed to subscribe.");
        } finally {
            setSubLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        if (!item) return;
        if (!confirm("Are you sure you want to unsubscribe?")) return;

        setSubLoading(true);
        try {
            await authFetch("/sub", {
                method: "DELETE",
                body: JSON.stringify({
                    title: item.title,
                    type: type,
                }),
            });
            setIsSubscribed(false);
        } catch (err) {
            console.error("Unsubscribe failed:", err);
            alert("Failed to unsubscribe.");
        } finally {
            setSubLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="details-page-loading">
                <div className="spinner-large"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="details-page-error">
                <h2>Error</h2>
                <p>{error || "Item not found"}</p>
                <button onClick={() => navigate(-1)} className="btn-secondary">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="details-page">
            <button onClick={() => navigate(-1)} className="back-button">
                <ArrowLeft size={20} /> Back
            </button>

            <div className="details-content">
                <div className="details-sidebar">
                    <img
                        src={item.images?.jpg?.large_image_url}
                        alt={item.title}
                        className="details-cover"
                    />

                    <div className="action-buttons">
                        {isSubscribed ? (
                            <button
                                onClick={handleUnsubscribe}
                                disabled={subLoading}
                                className="btn-danger full-width"
                            >
                                {subLoading ? "Processing..." : (
                                    <>
                                        <Trash2 size={18} /> Unsubscribe
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleSubscribe}
                                disabled={subLoading}
                                className="btn-primary full-width"
                            >
                                {subLoading ? "Processing..." : (
                                    <>
                                        <Heart size={18} /> Subscribe
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Score</span>
                            <span className="value flex-center">
                                <Star size={16} className="star-icon" /> {item.score || "N/A"}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="label">Status</span>
                            <span className="value">{item.status}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Type</span>
                            <span className="value">{item.type}</span>
                        </div>
                        {item.episodes && (
                            <div className="info-item">
                                <span className="label">Episodes</span>
                                <span className="value">{item.episodes}</span>
                            </div>
                        )}
                        {item.chapters && (
                            <div className="info-item">
                                <span className="label">Chapters</span>
                                <span className="value">{item.chapters}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="details-main">
                    <h1 className="details-title">{item.title}</h1>
                    {item.title_english && (
                        <h2 className="details-subtitle">{item.title_english}</h2>
                    )}

                    <div className="genres-list">
                        {item.genres?.map((g) => (
                            <span key={g.mal_id} className="genre-tag">
                                {g.name}
                            </span>
                        ))}
                    </div>

                    <div className="synopsis-section">
                        <h3>Synopsis</h3>
                        <p>{item.synopsis}</p>
                    </div>

                    {item.background && (
                        <div className="background-section">
                            <h3>Background</h3>
                            <p>{item.background}</p>
                        </div>
                    )}

                    <div className="external-links">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-external">
                            View on MyAnimeList
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
