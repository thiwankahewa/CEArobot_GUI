// src/App.jsx
import React from "react";
import ModeToggle from "./components/ModeToggle";

function App() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <h1>Greenhouse Robot GUI - Test</h1>
      
      <ModeToggle />
    </div>
  );
}

export default App;
