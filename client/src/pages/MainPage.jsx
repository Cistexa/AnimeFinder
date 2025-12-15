import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function MainPage() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribingId, setSubscribingId] = useState(null);
  const [subscribedKeys, setSubscribedKeys] = useState(new Set());
  const [unsubscribingKey, setUnsubscribingKey] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [mainData, subData] = await Promise.all([
          authFetch("/main"),
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
  }, [authFetch]);

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

  if (loading) return <div className="center-card">Loading...</div>;
  if (error) return <div className="center-card error">{error}</div>;

  return (
    <div>
      <h1>Main</h1>
      <p>Popular anime & manga. Click subscribe to save to your list.</p>
      <div className="grid">
        {items.map((item) => (
          <div key={`${item.type}-${item.external_id}`} className="card">
            {item.image && (
              <img src={item.image} alt={item.title} className="card-image" />
            )}
            <div className="card-body">
              <span className="badge">{item.type}</span>
              <h3>{item.title}</h3>
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
    </div>
  );
}


