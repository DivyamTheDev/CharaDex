import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Heart, Sparkles, Tv, Calendar } from "lucide-react";

// Local SVG component for YouTube icon to prevent version/build conflicts
const Youtube = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

const API_BASE = "http://localhost:5000/api";

export default function CharacterDetail() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCharacterDetail();
  }, [id]);

  const fetchCharacterDetail = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/characters/${id}`);
      setCharacter(res.data);
      if (res.data.images && res.data.images.length > 0) {
        setActiveImage(res.data.images[0]);
      }
    } catch (err) {
      console.error("Failed to load character details:", err);
      setError("We couldn't retrieve the character details. They may have been deleted or the API is unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format AniList markdown-like bios
  const renderBio = (bioText) => {
    if (!bioText) return "No biography available.";
    
    // Replace AniList spoilers and markup for clean rendering
    return bioText
      .replace(/~!|!~/g, "")
      .split("\n\n")
      .map((paragraph, index) => (
        <p key={index} className="text-slate-300 leading-relaxed text-base mb-4">
          {paragraph}
        </p>
      ));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400">Loading character files...</p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-2">Error Occurred</h2>
          <p>{error || "Character not found."}</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 text-left">
      {/* Back Button */}
      <Link
        to={-1}
        className="inline-flex items-center space-x-2 text-slate-400 hover:text-indigo-400 font-semibold transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Go Back</span>
      </Link>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Images Gallery (Cols: 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Display Image */}
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-2xl relative">
            <img
              src={activeImage}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails list */}
          {character.images && character.images.length > 1 && (
            <div className="flex overflow-x-auto gap-3 py-1 scrollbar-thin">
              {character.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === img ? "border-indigo-500 scale-95" : "border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Details & Bio (Cols: 7) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Character Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${
                character.gender === "male" 
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/25" 
                  : "bg-pink-500/10 text-pink-400 border-pink-500/25"
              }`}>
                {character.gender}
              </span>
              {character.isTopCharacter && (
                <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 text-xs font-bold tracking-wider px-3 py-1 rounded-full flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Top Star</span>
                </span>
              )}
              {character.isFanFavorite && (
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-xs font-bold tracking-wider px-3 py-1 rounded-full flex items-center space-x-1">
                  <Heart className="h-3 w-3 fill-indigo-400" />
                  <span>Fan Favorite</span>
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-100 mt-1">
              {character.name}
            </h1>
            
            <div className="flex items-center space-x-2 text-slate-400 text-lg">
              <Tv className="h-5 w-5 text-indigo-400 shrink-0" />
              <span className="font-semibold">{character.series}</span>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
            <div className="text-center p-3 border-r border-slate-700/60">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Popularity Score</div>
              <div className="text-2xl font-black text-yellow-400 mt-1">
                {character.popularity.toLocaleString()}
              </div>
            </div>
            
            <div className="text-center p-3 border-r border-slate-700/60">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Source</div>
              <div className="text-sm font-bold text-slate-200 mt-2 truncate">
                {character.sources.anilistId ? "AniList" : ""}
                {character.sources.anilistId && character.sources.malId ? " + " : ""}
                {character.sources.malId ? "MyAnimeList" : ""}
              </div>
            </div>

            <div className="text-center col-span-2 sm:col-span-1 p-3">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Added</div>
              <div className="text-sm font-semibold text-slate-200 mt-2 flex items-center justify-center space-x-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{new Date(character.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Video Section (YouTube Embed) */}
          {character.videoId && (
            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
                <Youtube className="h-5 w-5 text-red-500 fill-red-500" />
                <span>Character Spotlight Video</span>
              </h2>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-slate-950">
                <iframe
                  src={`https://www.youtube.com/embed/${character.videoId}?autoplay=1&mute=0`}
                  title={`${character.name} Highlight video`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          )}

          {/* Biography Section */}
          <div className="space-y-3">
            <h2 className="text-xl font-extrabold text-slate-100">Biography</h2>
            <div className="bg-slate-800/30 border border-slate-700/30 p-6 rounded-2xl">
              {renderBio(character.bio)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
