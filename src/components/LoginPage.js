import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize a new Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      onLogin(data.user); // Pass user data to the parent component
    } catch (err) {
      setError(err.message || "An error occurred while logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", // Gradient background
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Header */}
      <header
        style={{
          width: "100%",
          backgroundColor: "#ffffff", // Bootstrap primary color
          color: "white",
          textAlign: "center",
          marginBottom: "4rem",
        }}
      >
        <h1
          style={{
            fontFamily: "'Poppins', sans-serif", // Use a modern font
            fontSize: "2.5rem", // Larger font size
            fontWeight: "600", // Semi-bold
            color: "#00204f", // Bootstrap primary color
            textAlign: "center", // Center the title
            marginTop: "1rem", // Add some spacing
            marginBottom: "1.5rem", // Add some spacing
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)", // Subtle shadow
            letterSpacing: "1px", // Slightly spaced letters
          }}
        >
          Hibret Be Geta
        </h1>
      </header>

      {/* Login Form */}
      <div
        className="card p-4 shadow-sm"
        style={{
          maxWidth: "500px",
          width: "100%",
          backgroundColor: "white",
          borderRadius: "10px",
        }}
      >
        <h2
          className="text-center mb-4"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "1.75rem",
            fontWeight: "600",
            color: "#0d6efd",
          }}
        >
          Admin Login
        </h2>
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}
        <form>
          <div className="mb-3">
            <label
              htmlFor="email"
              className="form-label"
              style={{
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#495057",
                marginBottom: "0.5rem",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "0.75rem",
                fontSize: "0.9rem",
                borderRadius: "5px",
                border: "1px solid #ced4da",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="form-label"
              style={{
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#495057",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "0.75rem",
                fontSize: "0.9rem",
                borderRadius: "5px",
                border: "1px solid #ced4da",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            />
          </div>
          <div className="d-grid gap-2">
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                backgroundColor: "#0d6efd",
                border: "none",
                padding: "0.75rem",
                fontSize: "1rem",
                fontWeight: "600",
                borderRadius: "5px",
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Loading...
                </>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
