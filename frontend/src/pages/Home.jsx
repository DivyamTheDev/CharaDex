import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import CharacterCard from "../components/CharacterCard";
import CharacterGrid from "../components/CharacterGrid";
import { Sparkles, Trophy, Heart, ArrowRight } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchVal = searchParams.get("search") || "";
  const categoryVal = searchParams.get("category") || "";

  // Data states
  const [topCharacters, setTopCharacters] = useState([]);
  const [favoriteCharacters, setFavoriteCharacters] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [seriesList, setSeriesList] = useState([]);

  // Loading and pagination states
  const [isLoadingTop, setIsLoadingTop] = useState(true);
  const [isLoadingFav, setIsLoadingFav] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchPagination, setSearchPagination] = useState(null);
  const [searchPage, setSearchPage] = useState(1);
  const [selectedSeries, setSelectedSeries] = useState("");

  // Clean local search text
  const [localSearch, setLocalSearch] = useState(searchVal);

  useEffect(() => {
    setLocalSearch(searchVal);
    if (searchVal || categoryVal) {
      fetchSearchResults(searchVal, categoryVal, searchPage, selectedSeries);
    } else {
      fetchHomeData();
    }
  }, [searchVal, categoryVal, searchPage, selectedSeries]);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/series`);
      setSeriesList(res.data);
    } catch (err) {
      console.error("Failed to fetch series list:", err);
    }
  };

  const fetchHomeData = async () => {
    setIsLoadingTop(true);
    setIsLoadingFav(true);
    try {
      const [topRes, favRes] = await Promise.all([
        axios.get(`${API_BASE}/characters?category=top&limit=8`),
        axios.get(`${API_BASE}/characters?category=favorite&limit=8`)
      ]);
      setTopCharacters(topRes.data.characters);
      setFavoriteCharacters(favRes.data.characters);
    } catch (err) {
      console.error("Error loading home page content:", err);
    } finally {
      setIsLoadingTop(false);
      setIsLoadingFav(false);
    }
  };

  const fetchSearchResults = async (query, category, pageNum, seriesFilter) => {
    setIsLoadingSearch(true);
    try {
      let url = `${API_BASE}/characters?page=${pageNum}&limit=8`;
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      if (category) {
        url += `&category=${category}`;
      }
      const res = await axios.get(url);
      
      let filtered = res.data.characters;
      if (seriesFilter) {
        filtered = filtered.filter(c => c.series.toLowerCase() === seriesFilter.toLowerCase());
      }
      
      setSearchResults(filtered);
      setSearchPagination(res.data.pagination);
    } catch (err) {
      console.error("Error loading search/filter results:", err);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchPage(1);
    if (localSearch.trim()) {
      setSearchParams({ search: localSearch.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handlePageChange = (newPage) => {
    setSearchPage(newPage);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const clearSearch = () => {
    setLocalSearch("");
    setSelectedSeries("");
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24">
      {/* Hero Header Section */}
      {!searchVal && (
        <div className="relative rounded-3xl overflow-hidden border border-purple-500/10 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl neon-glow-purple transition-all duration-500">
          {/* Looping Background Video */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <video
              src="/homepage_bg.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#110d29]/80 via-[#0b0717]/90 to-[#0b0717]/70" />
          </div>

          <div className="space-y-6 max-w-2xl text-center md:text-left z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-100 leading-none tracking-tight">
              Discover Your Favorite <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-brand-cyan">Anime Characters</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
              Explore databases, character profiles, image galleries, and trending moments from the most popular anime of all time.
            </p>
            {/* Inline search */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="text"
                placeholder="Search Luffy, Gojo, Levi..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="flex-grow bg-[#130d22]/90 border border-purple-500/20 rounded-xl px-5 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm backdrop-blur"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-300 text-sm flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-purple-600/20"
              >
                <span>Search Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
          <div className="hidden md:flex items-center justify-center shrink-0 w-80 h-80 relative">
            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <Sparkles className="h-40 w-40 text-purple-400 animate-pulse drop-shadow-[0_0_20px_rgba(139,92,246,0.35)]" />
          </div>
        </div>
      )}

      {/* SEARCH OR CATEGORY FILTER RESULTS VIEW */}
      {searchVal || categoryVal ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-purple-500/10 pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
                {searchVal ? (
                  <>
                    <span>Search Results for</span>
                    <span className="text-purple-400">"{searchVal}"</span>
                  </>
                ) : (
                  <>
                    <span>Category:</span>
                    <span className="text-purple-400">
                      {categoryVal === "top" ? "Top Characters" : "Fan Favorites"}
                    </span>
                  </>
                )}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1.5">
                Showing matching character profiles
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Series Filter inside search results */}
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="bg-[#130d22]/70 text-slate-200 border border-purple-500/20 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
              >
                <option value="">All Anime Series</option>
                {seriesList.map((series) => (
                  <option key={series} value={series}>
                    {series}
                  </option>
                ))}
              </select>

              <button
                onClick={clearSearch}
                className="text-xs bg-[#130d22]/70 border border-purple-500/20 hover:bg-[#1a122e] text-slate-300 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          </div>

          <CharacterGrid 
            characters={searchResults} 
            isLoading={isLoadingSearch} 
            pagination={searchPagination}
            onPageChange={handlePageChange}
          />
        </div>
      ) : (
        /* HOME DEFAULT VIEW */
        <div className="space-y-16">
          {/* Top Characters Row */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-purple-500/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <Trophy className="h-6 w-6 text-yellow-500 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-purple-300">Top Characters</h2>
              </div>
              <Link to="/?category=top" className="text-xs font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 flex items-center space-x-1">
                <span>View More</span>
                <ArrowRight className="h-3 w-3 text-purple-400" />
              </Link>
            </div>

            {isLoadingTop ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-purple-950/20 rounded-2xl h-[420px] border border-purple-500/5" />
                ))}
              </div>
            ) : (
              /* Horizontal Scrollable Row for Top Characters */
              <div className="flex overflow-x-auto gap-6 scrollbar-hide py-2 px-1 snap-x select-none">
                {topCharacters.map((char) => (
                  <div key={char._id} className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] snap-start">
                    <CharacterCard character={char} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Fan Favorites Row */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-purple-500/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <Heart className="h-6 w-6 text-pink-500 fill-pink-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-pink-300">Fan Favorites</h2>
              </div>
              <Link to="/?category=favorite" className="text-xs font-bold uppercase tracking-wider text-pink-400 hover:text-pink-300 flex items-center space-x-1">
                <span>View More</span>
                <ArrowRight className="h-3 w-3 text-pink-400" />
              </Link>
            </div>

            {isLoadingFav ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-purple-950/20 rounded-2xl h-[420px] border border-purple-500/5" />
                ))}
              </div>
            ) : (
              /* Horizontal Scrollable Row for Fan Favorites */
              <div className="flex overflow-x-auto gap-6 scrollbar-hide py-2 px-1 snap-x select-none">
                {favoriteCharacters.map((char) => (
                  <div key={char._id} className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] snap-start">
                    <CharacterCard character={char} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
