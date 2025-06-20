import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JSONUploader from "./components/JSONUploader";
import UpgradePage from "./components/UpgradePage"; // You’ll create this
import "./App.css";

import Home from "./pages/Home";

import JSONFormatter from "./pages/JSONFormatter";

function App() {
  const userPlanLimitMB = 50;
  const usedMB = 0;
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode-active");
    } else {
      document.body.classList.remove("dark-mode-active");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Router>
      <div className={`app-container ${isDarkMode ? "dark-mode" : ""}`}>
        <header className="app-header">
          <h1 className="app-title">JSON Merge Tool</h1>
          <div className="theme-toggle-container">
            <label className="switch">
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
              <span className="slider round"></span>
            </label>
            <span className="theme-text">{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
          </div>
        </header>

        <Routes>
          {/* <Route
            path="/"
            element={
              <JSONUploader
                limitMB={userPlanLimitMB}
                usedMB={usedMB}
                isDarkMode={isDarkMode}
              />
            }
          /> */}

          <Route path="/" element={<Home />} />
          <Route path="/merge" element={<JSONUploader limitMB={50} usedMB={49} isDarkMode={isDarkMode} />} />
          <Route path="/formatter" element={<JSONFormatter />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/success" element={<h2>✅ Payment Successful! Plan Upgraded.</h2>} />
          <Route path="/cancel" element={<h2>❌ Payment Canceled. You weren't charged.</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
