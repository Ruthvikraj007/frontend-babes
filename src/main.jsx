import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

// ✅ FIXED: Check if root element exists before rendering
const rootElement = document.getElementById("root");

if (!rootElement) {
  // Create a fallback UI if root element doesn't exist
  document.body.innerHTML = `
    <div style="
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      background: #1a1a1a; 
      color: white; 
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #e74c3c; margin-bottom: 20px;">🚨 Root Element Missing</h1>
        <p style="margin-bottom: 10px;">The #root element was not found in the HTML.</p>
        <p style="margin-bottom: 20px;">Please check your index.html file.</p>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; font-family: monospace;">
          &lt;div id="root"&gt;&lt;/div&gt;
        </div>
      </div>
    </div>
  `;
  throw new Error("Root element not found. Please add <div id='root'></div> to your HTML.");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    // Temporarily disable StrictMode for WebRTC development
    // StrictMode causes double mounting which breaks WebRTC initialization
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
  );
  
  console.log("✅ React app mounted successfully!");
  
} catch (error) {
  console.error("❌ Failed to mount React app:", error);
  
  // Show error to user
  rootElement.innerHTML = `
    <div style="
      padding: 40px; 
      background: #e74c3c; 
      color: white; 
      border-radius: 10px; 
      text-align: center;
      font-family: Arial, sans-serif;
    ">
      <h1>🚨 Application Error</h1>
      <p>Failed to start the application. Please refresh the page.</p>
      <button 
        onclick="window.location.reload()" 
        style="
          background: white; 
          color: #e74c3c; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          cursor: pointer;
          margin-top: 15px;
        "
      >
        Reload Page
      </button>
      <details style="margin-top: 20px; text-align: left;">
        <summary>Technical Details</summary>
        <pre style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; overflow: auto;">
${error.toString()}
        </pre>
      </details>
    </div>
  `;
}