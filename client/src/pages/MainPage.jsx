import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import NewReleasesBox from "../components/NewReleasesBox.jsx";
import "../styles.css";

export default function MainPage() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribingId, setSubscribingId] = useState(null);
  const [subscribedKeys, setSubscribedKeys] = useState(new Set());
  const [unsubscribingKey, setUnsubscribingKey] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      window.scrollTo(0, 0); // Scroll to top when page loads/changes
      setLoading(true); // Ensure loading state is true when fetching new page
      try {
        const [mainData, subData] = await Promise.all([
          authFetch(`/main?page=${page}`),
          authFetch("/sub"),
        ]);
        setItems(mainData.items || []);
        const keys = new Set(
          (subData.subscriptions || []).map(
            (s) => `${s.item?.type}:${s.item?.title}`
          )
        );
        setSubscribedKeys(keys);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authFetch, page]);

  const keyFor = (item) => `${item.type}:${item.title}`;

  const handleSub = async (item) => {
    setSubscribingId(item.external_id);
    try {
      await authFetch("/sub", {
        method: "POST",
        body: JSON.stringify({
          title: item.title,
          type: item.type,
          description: item.description,
        }),
      });
      setSubscribedKeys((prev) => new Set(prev).add(keyFor(item)));
    } catch (err) {
      alert(err.message);
    } finally {
      setSubscribingId(null);
    }
  };

  const handleUnsub = async (item) => {
    const key = keyFor(item);
    setUnsubscribingKey(key);
    try {
      await authFetch("/sub", {
        method: "DELETE",
        body: JSON.stringify({
          title: item.title,
          type: item.type,
        }),
      });
      setSubscribedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setUnsubscribingKey(null);
    }
  };

  if (loading && items.length === 0) return <div className="center-card">Loading...</div>;
  if (error) return <div className="center-card error">{error}</div>;

  return (
    <div>
      <h1>Main</h1>
      <NewReleasesBox />
      <p>Popular anime & manga. Click subscribe to save to your list.</p>
      <div className="grid">
        {items.map((item) => (
          <div key={`${item.type}-${item.external_id}`} className="card">
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="card-image"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/details/${item.type}/${item.external_id}`)}
              />
            )}
            <div className="card-body">
              <span className="badge">{item.type}</span>
              <h3
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/details/${item.type}/${item.external_id}`)}
              >
                {item.title}
              </h3>
              <p className="card-text">
                {item.description
                  ? item.description.slice(0, 160) + "..."
                  : "No description"}
              </p>
              {subscribedKeys.has(keyFor(item)) ? (
                <div className="sub-actions">
                  <button className="btn-success" disabled>
                    ✓ Sub
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleUnsub(item)}
                    disabled={unsubscribingKey === keyFor(item)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => handleSub(item)}
                  disabled={subscribingId === item.external_id}
                >
                  {subscribingId === item.external_id
                    ? "Subscribing..."
                    : "Sub"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pagination" style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px", paddingBottom: "20px" }}>
        <button
          className="btn-secondary"
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span style={{ alignSelf: "center", fontSize: "1.2rem" }}>Page {page}</span>
        <button
          className="btn-secondary"
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}


