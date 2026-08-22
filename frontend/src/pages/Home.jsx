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
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
          <div className="space-y-6 max-w-2xl text-center md:text-left z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-100 leading-tight">
              Discover Your Favorite <span className="text-indigo-400">Anime Characters</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
              Explore databases, character profiles, image galleries, and trending moments from the most popular anime of all time.
            </p>
            {/* Inline search */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="text"
                placeholder="Search Luffy, Gojo, Levi..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="flex-grow bg-slate-800/80 border border-slate-700 rounded-xl px-5 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm backdrop-blur"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-xl transition text-sm flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-indigo-600/20"
              >
                <span>Search Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
          <div className="hidden md:flex items-center justify-center shrink-0 w-80 h-80 relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
            <Sparkles className="h-40 w-40 text-indigo-400 animate-bounce" />
          </div>
        </div>
      )}

      {/* SEARCH OR CATEGORY FILTER RESULTS VIEW */}
      {searchVal || categoryVal ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
                {searchVal ? (
                  <>
                    <span>Search Results for</span>
                    <span className="text-indigo-400">"{searchVal}"</span>
                  </>
                ) : (
                  <>
                    <span>Category:</span>
                    <span className="text-indigo-400">
                      {categoryVal === "top" ? "Top Characters" : "Fan Favorites"}
                    </span>
                  </>
                )}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Showing matching character profiles
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Series Filter inside search results */}
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition"
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
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h2 className="text-2xl font-extrabold text-slate-100">Top Characters</h2>
              </div>
              <Link to="/?category=top" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                <span>View More</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoadingTop ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl h-[420px]" />
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
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
                <h2 className="text-2xl font-extrabold text-slate-100">Fan Favorites</h2>
              </div>
              <Link to="/?category=favorite" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                <span>View More</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoadingFav ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl h-[420px]" />
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
