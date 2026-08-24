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
    <nav className="glass-panel text-slate-100 sticky top-0 z-50 border-b border-purple-500/10 shadow-lg shadow-purple-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-brand-cyan hover:brightness-110 transition-all">
              <Compass className="h-6 w-6 text-purple-400" />
              <span>CHARADEX</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:text-purple-400 ${
                location.pathname === "/" && !location.search ? "text-purple-400 border-b-2 border-purple-500 pb-1" : "text-slate-300"
              }`}
            >
              Home
            </Link>
            <Link
              to="/gender/male"
              className={`text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:text-sky-400 ${
                location.pathname === "/gender/male" ? "text-sky-400 border-b-2 border-sky-400 pb-1" : "text-slate-300"
              }`}
            >
              Male Tab
            </Link>
            <Link
              to="/gender/female"
              className={`text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:text-pink-400 ${
                location.pathname === "/gender/female" ? "text-pink-400 border-b-2 border-pink-400 pb-1" : "text-slate-300"
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
                className="w-full bg-[#130d22]/70 text-slate-100 placeholder-slate-500 text-sm rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all border border-purple-500/20"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-purple-400" />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0b0717]/95 border-t border-purple-500/10 flex justify-around items-center h-16 z-50 backdrop-blur-lg">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
            location.pathname === "/" ? "text-purple-400" : "text-slate-400"
          }`}
        >
          <Compass className="h-5 w-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/gender/male"
          className={`flex flex-col items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
            location.pathname === "/gender/male" ? "text-sky-400" : "text-slate-400"
          }`}
        >
          <UserCheck className="h-5 w-5 mb-0.5" />
          <span>Male</span>
        </Link>
        <Link
          to="/gender/female"
          className={`flex flex-col items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
            location.pathname === "/gender/female" ? "text-pink-400" : "text-slate-400"
          }`}
        >
          <Heart className="h-5 w-5 mb-0.5" />
          <span>Female</span>
        </Link>
      </div>
    </nav>
  );
}
