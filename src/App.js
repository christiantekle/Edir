import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UserList from "./components/UserList";
import UserListReadOnly from "./components/UserListReadOnly";
import LoginPage from "./components/LoginPage";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const App = () => {
  const [user, setUser] = useState(null); // The logged-in user
  const [role, setRole] = useState(null); // Their role: admin / viewer
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const loadUserAndRole = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError.message);
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const user = session.user;
          setUser(user);

          // Fetch the role from user_profiles
          const { data: profile, error: roleError } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (roleError) {
            console.error("Error loading role:", roleError.message);
            setRole(null); // Handle case where role fetch fails
          } else {
            setRole(profile?.role || null); // Set role or null if no profile
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Unexpected error:", err.message);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadUserAndRole();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          loadUserAndRole(); // Reload role on sign-in
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Cleanup listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: 0 }}>
      {user ? (
        <>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#ffffff",
              textAlign: "center",
              margin: "0",
              backgroundColor: "rgb(17, 59, 73)",
              padding: "2rem",
              textTransform: "uppercase",
              lineHeight: "1.5",
              width: "100vw",
              position: "relative",
              left: "50%",
              right: "50%",
              marginLeft: "-50vw",
              marginRight: "-50vw",
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
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "15px",
              marginTop: "1rem",
            }}
          >
            <button className="btn btn-danger mb-4" onClick={handleLogout}>
              Logout
            </button>

            {role === "admin" ? (
              <UserList />
            ) : role === "viewer" ? (
              <UserListReadOnly />
            ) : (
              <p>Loading role...</p>
            )}
          </div>
        </>
      ) : (
        <LoginPage onLogin={setUser} />
      )}
    </div>
  );
};

export default App;
