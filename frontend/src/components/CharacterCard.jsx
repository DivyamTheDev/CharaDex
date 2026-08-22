import React from "react";
import { Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";

export default function CharacterCard({ character }) {
  // Determine gender badge styles
  const genderStyles = {
    male: "bg-sky-500/10 text-sky-400 border-sky-500/25",
    female: "bg-pink-500/10 text-pink-400 border-pink-500/25",
    other: "bg-slate-500/10 text-slate-400 border-slate-500/25"
  };

  const currentGenderStyle = genderStyles[character.gender] || genderStyles.other;

  // Primary image
  const primaryImage = character.images && character.images.length > 0 
    ? character.images[0] 
    : "https://placehold.co/300x450/1e293b/cbd5e1?text=No+Image";

  return (
    <div className="group relative bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
      {/* Popularity Badge */}
      <div className="absolute top-3 right-3 z-10 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-yellow-400 border border-yellow-500/20 flex items-center space-x-1 shadow-md">
        <Heart className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
        <span>{character.popularity.toLocaleString()}</span>
      </div>

      {/* Specialty Badges (Top Character, Fan Favorite) */}
      {(character.isTopCharacter || character.isFanFavorite) && (
        <div className="absolute top-3 left-3 z-10 bg-indigo-600/85 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center space-x-1 shadow-md">
          <Sparkles className="h-3 w-3" />
          <span>{character.isTopCharacter ? "Top" : "Favorite"}</span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-950">
        <img
          src={primaryImage}
          alt={character.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
      </div>

      {/* Details Container */}
      <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-slate-800 to-slate-900">
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border self-start mb-2 ${currentGenderStyle}`}>
          {character.gender}
        </span>
        <h3 className="text-lg font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
          {character.name}
        </h3>
        <p className="text-sm text-slate-400 mt-1 line-clamp-1 flex-grow">
          {character.series}
        </p>

        {/* View Details Link */}
        <div className="mt-4 pt-3 border-t border-slate-700/60">
          <Link
            to={`/character/${character._id}`}
            className="w-full inline-flex justify-center items-center px-4 py-2 bg-slate-700 hover:bg-indigo-600 text-slate-100 hover:text-white text-xs font-semibold rounded-lg transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
