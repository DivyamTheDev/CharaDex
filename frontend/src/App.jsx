import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import GenderTab from "./pages/GenderTab";
import CharacterDetail from "./pages/CharacterDetail";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
        {/* Global Navbar */}
        <Navbar />

        {/* Page Content Container */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gender/:gender" element={<GenderTab />} />
            <Route path="/character/:id" element={<CharacterDetail />} />
            {/* Fallback to Home if route not found */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-6 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} CharaDex Anime Database. Built with React, Tailwind v4, Express & MongoDB.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
