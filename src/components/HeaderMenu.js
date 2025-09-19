// client/src/components/HeaderMenu.js
import React from "react";
import { useTheme } from "./ThemeContext";

export default function HeaderMenu() {
    const { darkMode, toggleTheme } = useTheme();

    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 20px",
                background: darkMode ? "#121212" : "#ffffff",
                color: darkMode ? "#f1f1f1" : "#111",
                borderBottom: darkMode ? "1px solid #333" : "1px solid #ddd",
            }}
        >
            <h1 style={{ margin: 0 }}>StockVision</h1>

            <button
                onClick={toggleTheme}
                style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    background: darkMode ? "#444" : "#eee",
                    color: darkMode ? "#f1f1f1" : "#111",
                }}
            >
                {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
        </header>
    );
}
