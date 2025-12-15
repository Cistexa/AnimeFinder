import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function SubPage() {
  const { authFetch } = useAuth();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authFetch("/sub");
        setSubs(data.subscriptions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authFetch]);

  if (loading) return <div className="center-card">Loading...</div>;
  if (error) return <div className="center-card error">{error}</div>;

  return (
    <div>
      <h1>Your Subscriptions</h1>
      {subs.length === 0 && <p>You don&apos;t have any subs yet.</p>}
      <div className="grid">
        {subs.map((sub) => (
          <div key={sub.id} className="card">
            <div className="card-body">
              <span className="badge">{sub.item?.type}</span>
              <h3>{sub.item?.title}</h3>
              <p className="card-text">{sub.item?.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


