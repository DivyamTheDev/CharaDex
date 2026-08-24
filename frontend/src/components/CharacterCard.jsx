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
    <div className="group relative glass-panel glass-panel-hover rounded-2xl overflow-hidden shadow-lg shadow-purple-950/15 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-purple-500/10 flex flex-col h-full">
      {/* Popularity Badge */}
      <div className="absolute top-3 right-3 z-10 bg-[#0e0a1b]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-yellow-400 border border-yellow-500/20 flex items-center space-x-1 shadow-md">
        <Heart className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
        <span>{character.popularity.toLocaleString()}</span>
      </div>

      {/* Specialty Badges (Top Character, Fan Favorite) */}
      {character.isTopCharacter && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-950 flex items-center space-x-1 shadow-lg shadow-yellow-500/10 border border-yellow-300/30">
          <Sparkles className="h-3 w-3 fill-slate-950" />
          <span>Top Star</span>
        </div>
      )}
      {!character.isTopCharacter && character.isFanFavorite && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-pink-500 to-purple-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white flex items-center space-x-1 shadow-lg shadow-pink-500/10 border border-pink-400/30">
          <Heart className="h-3 w-3 fill-white" />
          <span>Favorite</span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-950">
        <img
          src={primaryImage}
          alt={character.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0717] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
      </div>

      {/* Details Container */}
      <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-[#161124] to-[#0e0a1b]">
        <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border self-start mb-2.5 ${currentGenderStyle}`}>
          {character.gender}
        </span>
        <h3 className="text-lg font-black text-slate-100 line-clamp-1 group-hover:text-purple-400 transition-colors duration-300">
          {character.name}
        </h3>
        <p className="text-xs font-semibold text-slate-400 mt-1 line-clamp-1 flex-grow">
          {character.series}
        </p>

        {/* View Details Link */}
        <div className="mt-4 pt-3 border-t border-purple-500/10">
          <Link
            to={`/character/${character._id}`}
            className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md shadow-purple-500/10 hover:shadow-purple-500/30 cursor-pointer"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
