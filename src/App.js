import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UserList from "./components/UserList";
import LoginPage from "./components/LoginPage";
import { createClient } from "@supabase/supabase-js";

//Initialize a new Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    //Check if the user is already logged in
    const session = supabase.auth.getSession();
    session.then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="container mt-5">
      {user ? (
        <>
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
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
          <UserList />
        </>
      ) : (
        <LoginPage onLogin={setUser} />
      )}
    </div>
  );
};

export default App;
