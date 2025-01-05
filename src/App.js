import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UserList from "./components/UserList";

const App = () => {
  return (
    <div className="container mt-5">
      <h1 className="text-center">Hibret Be Geta</h1>
      <UserList />
    </div>
  );
};

export default App;
