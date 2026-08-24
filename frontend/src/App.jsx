import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import GenderTab from "./pages/GenderTab";
import CharacterDetail from "./pages/CharacterDetail";

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("charaDexIntroPlayed");
  });
  const [fadeIntro, setFadeIntro] = useState(false);
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (showIntro) {
      // Slow down playback rate to 55% speed (more cinematic)
      if (videoRef.current) {
        videoRef.current.playbackRate = 0.55;
      }

      // Start fading out slightly before removing the overlay (4 seconds total)
      const fadeTimer = setTimeout(() => {
        setFadeIntro(true);
      }, 3400);

      const removeTimer = setTimeout(() => {
        setShowIntro(false);
        sessionStorage.setItem("charaDexIntroPlayed", "true");
      }, 4000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [showIntro]);

  return (
    <Router>
      <div className="min-h-screen bg-[#0b0717] text-slate-100 flex flex-col font-sans antialiased relative">
        {/* Intro Opener Overlay */}
        {showIntro && (
          <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b0717] transition-opacity duration-500 ease-out overflow-hidden ${
              fadeIntro ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <video
              ref={videoRef}
              src="/intro.mp4"
              autoPlay
              muted
              playsInline
              className="absolute object-cover"
              style={{
                width: "100vh",
                height: "100vw",
                transform: "rotate(90deg)",
                transformOrigin: "center"
              }}
            />
          </div>
        )}

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
        <footer className="bg-[#0b0717] border-t border-purple-500/10 text-slate-600 py-6 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} CHARADEX Anime Database. Built with React, Tailwind v4, Express & MongoDB.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
