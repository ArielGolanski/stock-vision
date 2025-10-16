import React, { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeContext";
import HeaderMenu from "../components/HeaderMenu";
import { API_URL } from "../config";

const Settings = () => {
    const { darkMode } = useTheme();

    const [profile, setProfile] = useState({ firstName: "", lastName: "" });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");

    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");

    // Fetch user profile on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${API_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setProfile({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                });
            })
            .catch((err) => console.error("Profile fetch error:", err));
    }, []);

    // --- Profile update ---
    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage("");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(profile),
            });

            if (res.ok) {
                setProfileMessage("✅ Profile updated successfully");
            } else {
                const err = await res.json();
                setProfileMessage(`❌ ${err.message}`);
            }
        } catch (err) {
            setProfileMessage("❌ Server error");
        } finally {
            setProfileLoading(false);
        }
    };

    // --- Password update ---
    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordMessage("");

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage("❌ Passwords do not match");
            setPasswordLoading(false);
            return;
        }

        // Check minimum strength (must be at least Fair)
        const strength = getPasswordStrength(passwordForm.newPassword);
        if (["Weak", "❌ Too Short"].includes(strength.label)) {
            setPasswordMessage("❌ Password too weak. Choose a stronger one.");
            setPasswordLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/users/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(passwordForm),
            });

            if (res.ok) {
                setPasswordMessage("✅ Password updated successfully");
                setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const err = await res.json();
                setPasswordMessage(`❌ ${err.message}`);
            }
        } catch (err) {
            setPasswordMessage("❌ Server error");
        } finally {
            setPasswordLoading(false);
        }
    };

    // --- Password strength check ---
    const getPasswordStrength = (password) => {
        let score = 0;
        if (!password) return { label: "❌ Too Short", color: "#dc2626" };

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++; // special char

        switch (score) {
            case 0:
            case 1:
                return { label: "Weak", color: "#dc2626" };
            case 2:
                return { label: "Fair", color: "#d97706" };
            case 3:
                return { label: "Good", color: "#2563eb" };
            case 4:
                return { label: "Strong", color: "#059669" };
            default:
                return { label: "Weak", color: "#dc2626" };
        }
    };

    return (
        <div
            style={{
                padding: "20px",
                background: darkMode ? "#121212" : "#f9fafb",
                minHeight: "100vh",
                color: darkMode ? "#f1f1f1" : "#111",
            }}
        >
            <HeaderMenu />

            <h2>⚙️ Settings</h2>

            {/* Profile form */}
            <form
                onSubmit={handleProfileSave}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: darkMode ? "#1e1e1e" : "#fff",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    marginBottom: "30px",
                }}
            >
                <h3>👤 Profile</h3>

                <label>
                    First Name
                    <input
                        type="text"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleProfileChange}
                        style={{ width: "100%", padding: "8px" }}
                    />
                </label>

                <label>
                    Last Name
                    <input
                        type="text"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleProfileChange}
                        style={{ width: "100%", padding: "8px" }}
                    />
                </label>

                <button
                    type="submit"
                    disabled={profileLoading}
                    style={{
                        padding: "10px",
                        background: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginTop: "10px",
                    }}
                >
                    {profileLoading ? "Saving..." : "Save Profile"}
                </button>
            </form>

            {profileMessage && (
                <p
                    style={{
                        marginTop: "-20px",
                        marginBottom: "20px",
                        color: profileMessage.includes("✅") ? "#059669" : "#dc2626",
                    }}
                >
                    {profileMessage}
                </p>
            )}

            {/* Password form */}
            <form
                onSubmit={handlePasswordSave}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: darkMode ? "#1e1e1e" : "#fff",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
            >
                <h3>🔒 Change Password</h3>

                <label>
                    Current Password
                    <input
                        type="password"
                        name="oldPassword"
                        value={passwordForm.oldPassword}
                        onChange={handlePasswordChange}
                        style={{ width: "100%", padding: "8px" }}
                        required
                    />
                </label>

                <label>
                    New Password
                    <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        style={{ width: "100%", padding: "8px" }}
                        required
                    />
                </label>

                {/* Strength indicator */}
                {passwordForm.newPassword && (
                    <p
                        style={{
                            marginTop: "-8px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: getPasswordStrength(passwordForm.newPassword).color,
                        }}
                    >
                        Strength: {getPasswordStrength(passwordForm.newPassword).label}
                    </p>
                )}

                <label>
                    Confirm New Password
                    <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        style={{ width: "100%", padding: "8px" }}
                        required
                    />
                </label>

                <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                        padding: "10px",
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginTop: "10px",
                    }}
                >
                    {passwordLoading ? "Saving..." : "Change Password"}
                </button>
            </form>

            {passwordMessage && (
                <p
                    style={{
                        marginTop: "15px",
                        color: passwordMessage.includes("✅") ? "#059669" : "#dc2626",
                    }}
                >
                    {passwordMessage}
                </p>
            )}
        </div>
    );
};

export default Settings;
