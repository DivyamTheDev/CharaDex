import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Compass, Heart, UserCheck } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="bg-slate-900 text-slate-100 sticky top-0 z-50 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-wider text-indigo-400 hover:text-indigo-300">
              <Compass className="h-6 w-6" />
              <span>CharaDex</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                location.pathname === "/" && !location.search ? "text-indigo-400 border-b-2 border-indigo-400 pb-1" : "text-slate-300"
              }`}
            >
              Home
            </Link>
            <Link
              to="/gender/male"
              className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                location.pathname === "/gender/male" ? "text-indigo-400 border-b-2 border-indigo-400 pb-1" : "text-slate-300"
              }`}
            >
              Male Tab
            </Link>
            <Link
              to="/gender/female"
              className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                location.pathname === "/gender/female" ? "text-indigo-400 border-b-2 border-indigo-400 pb-1" : "text-slate-300"
              }`}
            >
              Female Tab
            </Link>
          </div>

          {/* Search Form */}
          <div className="flex-1 max-w-xs mx-4 sm:max-w-sm">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search character or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-700 transition-all border border-slate-700"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation for better responsive feel */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center h-16 z-50">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium ${
            location.pathname === "/" ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <Compass className="h-5 w-5 mb-1" />
          <span>Home</span>
        </Link>
        <Link
          to="/gender/male"
          className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium ${
            location.pathname === "/gender/male" ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <UserCheck className="h-5 w-5 mb-1" />
          <span>Male</span>
        </Link>
        <Link
          to="/gender/female"
          className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium ${
            location.pathname === "/gender/female" ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <Heart className="h-5 w-5 mb-1" />
          <span>Female</span>
        </Link>
      </div>
    </nav>
  );
}
