import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

//Initialize a new Supabase client
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

      onLogin(data.user); //Pass user data to the parent component
    } catch (err) {
      setError(err.message || "An error occurred while logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3">
        <input
          type="email"
          placeholder="Email"
          value="{email}"
          onChange={(e) => setEmail(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="mb-3">
        <input
          type="password"
          placeholder="Password"
          value="{password}"
          onChange={(e) => setPassword(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="d-flex gap-2">
        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary"
        />
        {loading ? "Loading..." : "Login"}
      </div>
    </div>
  );
};

export default LoginPage;
