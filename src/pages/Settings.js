import React, { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeContext";
import HeaderMenu from "../components/HeaderMenu";
import { API_URL } from "../config";

const Settings = () => {
    const { darkMode } = useTheme();

    const [profile, setProfile] = useState({ firstName: "", lastName: "" });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");

    // --- NEW STATES for Brokerage and Fees ---
    const [brokerages, setBrokerages] = useState([]); // List of all available brokerages
    const [brokerageData, setBrokerageData] = useState({
        selectedBrokerage: '', 
        customFeePerShare: 0,
        customFeeMinimum: 0,
    });
    const [feesLoading, setFeesLoading] = useState(true);
    // ------------------------------------------

    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");

    // Fetch user profile AND brokerages on mount (MODIFIED useEffect)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
             setFeesLoading(false);
             return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch ALL Brokerages (used for the dropdown list)
        fetch(`${API_URL}/api/brokerages`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setBrokerages(data);
                }
            })
            .catch(err => console.error("Brokerages list fetch error:", err));


        // 2. Fetch User Profile (to get current brokerage and fees)
        fetch(`${API_URL}/api/users/profile`, { headers })
            .then((res) => res.json())
            .then((data) => {
                setProfile({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                });
                
                // Set the current fees and brokerage ID from profile data
                setBrokerageData({
                    selectedBrokerage: data.brokerage || '',
                    customFeePerShare: data.customFeePerShare || 0,
                    customFeeMinimum: data.customFeeMinimum || 0,
                });
            })
            .catch((err) => console.error("Profile fetch error:", err))
            .finally(() => setFeesLoading(false));
            
    }, []);

    // --- Profile update handler (MODIFIED to handle fees) ---
    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleBrokerageChange = (e) => {
        const { name, value } = e.target;
        // Convert number inputs to float
        const parsedValue = name.startsWith('customFee') ? parseFloat(value) : value;
        setBrokerageData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage("");

        try {
            const token = localStorage.getItem("token");
            
            // Combine profile and brokerage data for the PUT request
            const updatedBody = {
                ...profile, 
                brokerage: brokerageData.selectedBrokerage,
                customFeePerShare: brokerageData.customFeePerShare,
                customFeeMinimum: brokerageData.customFeeMinimum,
            };

            const res = await fetch(`${API_URL}/api/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedBody),
            });

            if (res.ok) {
                setProfileMessage("✅ Profile and Fees updated successfully");
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
            setProfileMessage("❌ Server error");
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

    // Find the current brokerage name for display
    const currentBrokerage = brokerages.find(b => b._id === brokerageData.selectedBrokerage);

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

            {/* Profile and Brokerage Form (MODIFIED) */}
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
                <h3>👤 Profile & Brokerage Details</h3>

                {/* First Name / Last Name */}
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
                
                {/* Brokerage Selection */}
                <h4 style={{ margin: '15px 0 5px 0', borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`, paddingTop: '10px' }}>
                    Brokerage and Fees
                </h4>
                {feesLoading ? (
                    <p>Loading brokerage details...</p>
                ) : (
                    <>
                        <label>
                            Select Brokerage ({currentBrokerage ? currentBrokerage.name : 'Not set'})
                            <select
                                name="selectedBrokerage"
                                value={brokerageData.selectedBrokerage}
                                onChange={handleBrokerageChange}
                                style={{ width: "100%", padding: "8px" }}
                            >
                                <option value="">Select a Brokerage</option>
                                {brokerages.map(b => (
                                    <option key={b._id} value={b._id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        
                        {/* Custom Fee Per Share */}
                        <label>
                            Custom Fee Per Share (in usd$)
                            <input
                                type="number"
                                step="0.0001"
                                name="customFeePerShare"
                                value={brokerageData.customFeePerShare}
                                onChange={handleBrokerageChange}
                                style={{ width: "100%", padding: "8px" }}
                                required
                            />
                        </label>

                        {/* Custom Minimum Fee */}
                        <label>
                            Custom Minimum Fee (per command)
                            <input
                                type="number"
                                step="0.01"
                                name="customFeeMinimum"
                                value={brokerageData.customFeeMinimum}
                                onChange={handleBrokerageChange}
                                style={{ width: "100%", padding: "8px" }}
                                required
                            />
                        </label>
                    </>
                )}


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
                    {profileLoading ? "Saving..." : "Save Profile & Fees"}
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

            {/* Password form (unchanged) */}
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