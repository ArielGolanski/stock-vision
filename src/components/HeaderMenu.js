// client/src/components/HeaderMenu.js
import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // adjust path if needed

export default function HeaderMenu() {
    const { darkMode, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

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
                position: "relative",
            }}
        >
            {/* Logo */}
            <img
                src={logo}
                alt="StockVision Logo"
                style={{ height: "40px", cursor: "pointer" }}
                onClick={() => navigate("/")}
            />
            <h1 style={{ margin: 0 }}>StockVision</h1>

            {/* Hamburger Button */}
            <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{
                    fontSize: "20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: darkMode ? "#f1f1f1" : "#111",
                }}
            >
                ☰
            </button>

            {/* Dropdown bubble */}
            {menuOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "50px",
                        right: "20px",
                        background: darkMode ? "#1e1e1e" : "#fff",
                        color: darkMode ? "#f1f1f1" : "#111",
                        border: darkMode ? "1px solid #333" : "1px solid #ddd",
                        borderRadius: "8px",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                        padding: "12px",
                        minWidth: "160px",
                        zIndex: 1000,
                    }}
                >
                    <button
                        onClick={toggleTheme}
                        style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            color: "inherit",
                        }}
                    >
                        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                    </button>
                    <button
                        style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            color: "inherit",
                        }}
                        onClick={() => { navigate("/settings") }}
                    >
                        ⚙️ Settings
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            color: "inherit",
                        }}
                    >
                        🚪 Logout
                    </button>
                </div>
            )}
        </header>
    );
}
