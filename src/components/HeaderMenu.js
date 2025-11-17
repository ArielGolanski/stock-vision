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

    const lightGradient = "linear-gradient(90deg, #e5d88dff 0%, #22C1C3 100%)";
    const darkGradient = "linear-gradient(90deg, #4ef3aeff 0%, #005010ff 100%)";

    const headerBackground = darkMode ? darkGradient : lightGradient;
    const headerTextColor = darkMode ? "#f1f1f1" : "#111"; // לבן בכהה, שחור בבהיר

    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 20px",
                background: headerBackground, 
                color: headerTextColor, 
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
            {/* UPDATED FONT SIZE */}
            <h1 style={{ margin: 0, fontSize: "30px", color: headerTextColor }}>StockVision</h1> 

            {/* Hamburger Button */}
            <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{
                    fontSize: "20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: headerTextColor, // צבע כפתור מותאם
                }}
            >
                ☰
            </button>

            {/* Dropdown bubble */}
            {menuOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "65px", 
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
                        onClick={() => { navigate("/settings"); setMenuOpen(false); }}
                    >
                        ⚙️ Settings
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
                        onClick={() => { navigate("/accuracy"); setMenuOpen(false); }}
                    >
                        📈 Accuracy
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
                        onClick={() => { navigate("/competitor-predictions"); setMenuOpen(false); }}
                    >
                        🏆 Competitors
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