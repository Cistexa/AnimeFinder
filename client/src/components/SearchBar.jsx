import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css"; // We'll create this CSS next

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length < 3) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Parallel search for Anime and Manga
                const [animeRes, mangaRes] = await Promise.all([
                    axios.get(`https://api.jikan.moe/v4/anime?q=${query}&limit=3`),
                    axios.get(`https://api.jikan.moe/v4/manga?q=${query}&limit=3`),
                ]);

                const anime = animeRes.data.data.map((item) => ({ ...item, type: "anime" }));
                const manga = mangaRes.data.data.map((item) => ({ ...item, type: "manga" }));

                setResults([...anime, ...manga]);
                setShowResults(true);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (item) => {
        setShowResults(false);
        setQuery("");
        navigate(`/details/${item.type}/${item.mal_id}`);
    };

    return (
        <div className="search-bar-container" ref={searchRef}>
            <div className="search-input-wrapper">
                <Search className="search-icon" size={18} />
                <input
                    type="text"
                    placeholder="Search Anime or Manga..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 3 && setShowResults(true)}
                    className="search-input"
                />
                {loading && <Loader2 className="spinner" size={18} />}
            </div>

            {showResults && results.length > 0 && (
                <div className="search-results-dropdown">
                    {results.map((item) => (
                        <div
                            key={`${item.type}-${item.mal_id}`}
                            className="search-result-item"
                            onClick={() => handleSelect(item)}
                        >
                            <img
                                src={item.images.jpg.image_url}
                                alt={item.title}
                                className="result-image"
                            />
                            <div className="result-info">
                                <span className="result-title">{item.title}</span>
                                <span className="result-type">{item.type.toUpperCase()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
