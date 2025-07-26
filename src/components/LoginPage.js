import React, { useState } from "react";
import { supabase } from "../supabaseClient"; // Import the Supabase client

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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: 0 }}>
      {/* Header */}
      <header
        style={{
          width: "100vw",
          backgroundColor: "rgb(17, 59, 73)",
          margin: 0,
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
        }}
      >
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "2.5rem",
            fontWeight: "700",
            color: "#ffffff",
            textAlign: "center",
            margin: 0,
            padding: "2rem",
            textTransform: "uppercase",
            lineHeight: "1.5",
          }}
        >
          HIBRET BE GETA
          <br />
          ሕብረት በጌታ
          <div
            style={{
              borderBottom: "2px dotted #ffffff",
              marginTop: "0.5rem",
              width: "50%",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />
        </h1>
      </header>

      {/* Login Form */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "15px",
          marginTop: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(70vh - 120px)", // Adjust for header height
        }}
      >
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
            LOGIN
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
    </div>
  );
};

export default LoginPage;
