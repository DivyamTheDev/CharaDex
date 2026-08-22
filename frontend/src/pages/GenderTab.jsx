import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CharacterGrid from "../components/CharacterGrid";
import { User, Users } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

export default function GenderTab() {
  const { gender } = useParams(); // 'male' or 'female'
  const [characters, setCharacters] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  // Capitalize gender for headers
  const genderTitle = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "";

  // Reset page when gender route changes
  useEffect(() => {
    setPage(1);
    setSelectedSeries("");
  }, [gender]);

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    fetchGenderCharacters(gender, page);
  }, [gender, page, selectedSeries]);

  const fetchSeries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/series`);
      setSeriesList(res.data);
    } catch (err) {
      console.error("Failed to fetch series list:", err);
    }
  };

  const fetchGenderCharacters = async (genderVal, pageNum) => {
    setIsLoading(true);
    try {
      const url = `${API_BASE}/characters?gender=${genderVal}&page=${pageNum}&limit=12`;
      const res = await axios.get(url);
      
      let filtered = res.data.characters;
      if (selectedSeries) {
        filtered = filtered.filter(c => c.series.toLowerCase() === selectedSeries.toLowerCase());
      }
      
      setCharacters(filtered);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(`Error fetching ${genderVal} characters:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${gender === "male" ? "bg-sky-500/10 text-sky-400" : "bg-pink-500/10 text-pink-400"}`}>
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 m-0 leading-none">
              {genderTitle} Characters
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse and discover popular {gender} characters
            </p>
          </div>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-400 hidden sm:inline">
            FILTER BY SERIES
          </label>
          <select
            value={selectedSeries}
            onChange={(e) => {
              setSelectedSeries(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="">All Anime Series</option>
            {seriesList.map((series) => (
              <option key={series} value={series}>
                {series}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid displaying filtered results */}
      <CharacterGrid
        characters={characters}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
