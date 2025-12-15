import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AnimeFinderPage() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState([]);
  const [finished, setFinished] = useState(false);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authFetch("/animefinder");
        setItems(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authFetch]);

  const current = items[index];

  const handleChoice = async (choice) => {
    if (!current) return;

    if (choice === "like") {
      setLiked((prev) => [...prev, current]);
    }

    if (index + 1 >= items.length) {
      setFinished(true);
      try {
        const data = await authFetch("/animefinder/result", {
          method: "POST",
          body: JSON.stringify({ liked }),
        });
        setRecs(data.recommendations || []);
      } catch (err) {
        setError(err.message);
      }
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (loading) return <div className="center-card">Loading...</div>;
  if (error) return <div className="center-card error">{error}</div>;

  if (finished) {
    return (
      <div>
        <h1>Your Matches</h1>
        <p>Based on what you liked, here are some recommendations.</p>
        <div className="grid">
          {recs.map((a) => (
            <div key={a.id} className="card">
              {a.image && (
                <img src={a.image} alt={a.title} className="card-image" />
              )}
              <div className="card-body">
                <h3>{a.title}</h3>
                <p className="card-text">
                  {a.synopsis
                    ? a.synopsis.slice(0, 160) + "..."
                    : "No description"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!current) {
    return <div className="center-card">No anime loaded.</div>;
  }

  return (
    <div className="finder">
      <h1>Anime Finder</h1>
      <div className="finder-card">
        {current.image && (
          <img src={current.image} alt={current.title} className="card-image" />
        )}
        <div className="card-body">
          <h2>{current.title}</h2>
          <p className="card-text">
            {current.synopsis
              ? current.synopsis.slice(0, 200) + "..."
              : "No description"}
          </p>
        </div>
      </div>
      <div className="finder-actions">
        <button className="btn-secondary" onClick={() => handleChoice("dislike")}>
          Unlike
        </button>
        <button className="btn-primary" onClick={() => handleChoice("like")}>
          Like
        </button>
      </div>
      <p>
        {index + 1} / {items.length}
      </p>
    </div>
  );
}


