import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import GenderTab from "./pages/GenderTab";
import CharacterDetail from "./pages/CharacterDetail";

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [fadeIntro, setFadeIntro] = useState(false);
  const videoRef = React.useRef(null);

  const dismissIntro = () => {
    setFadeIntro(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 700);
  };

  const handleTimeUpdate = (e) => {
    // Ensure the video plays smoothly until 2.8s of actual playback time
    if (e.target.currentTime >= 2.8 && !fadeIntro) {
      dismissIntro();
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.65;
      videoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    // Safety fallback timer (dismisses after 8s if video cannot load or autoplay is restricted)
    const fallback = setTimeout(() => {
      if (showIntro && !fadeIntro) {
        dismissIntro();
      }
    }, 8000);

    return () => clearTimeout(fallback);
  }, [showIntro, fadeIntro]);

  return (
    <Router>
      <div className="min-h-screen bg-[#0b0717] text-slate-100 flex flex-col font-sans antialiased relative">
        {/* Intro Opener Overlay */}
        {showIntro && (
          <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b0717] transition-opacity duration-700 ease-out overflow-hidden ${
              fadeIntro ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <video
              ref={videoRef}
              src="/intro.mp4"
              autoPlay
              muted
              playsInline
              onLoadedMetadata={handleVideoLoaded}
              onTimeUpdate={handleTimeUpdate}
              onEnded={dismissIntro}
              className="absolute pointer-events-none"
              style={{
                top: "50%",
                left: "50%",
                width: "min(96vh, 54vw)",
                height: "min(96vw, 170.67vh)",
                transform: "translate(-50%, -50%) rotate(270deg)",
                transformOrigin: "center",
                objectFit: "contain"
              }}
            />
            {/* Skip Option */}
            <button
              onClick={dismissIntro}
              className="absolute bottom-6 right-6 z-10 px-4 py-2 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-purple-500/30 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider rounded-full transition cursor-pointer"
            >
              Skip Intro ✕
            </button>
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
