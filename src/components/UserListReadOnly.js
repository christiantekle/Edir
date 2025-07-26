import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const UserListReadOnly = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedYears, setExpandedYears] = useState({}); // Track the expanded year
  const [expandedUsers, setExpandedUsers] = useState({}); // Track the expanded user

  const MONTHS_ORDER = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: users, error } = await supabase.from("users").select("*");
        if (error) throw error;
        setUsers(users);
      } catch (err) {
        console.error("Error loading users", err);
        alert("Error loading users. Please try again.");
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      user.phoneNumber?.toString().includes(search) ||
      user.totalAmountPaid.toString().includes(search)
    );
  });

  const totalPaid = users.reduce((sum, user) => sum + user.totalAmountPaid, 0);

  const toggleUserDetails = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId], // Toggle the expanded state for this user
    }));
  };

  return (
    <div>
      <div className="summary-section mb-4">
        <p>
          <strong>Total Paid by All Users: </strong>
          {totalPaid} Euros
        </p>
        <div className="d-flex gap-4">
          <div>
            <strong>Total Users:</strong> {users.length}
          </div>
          <div>
            <strong>Single:</strong>{" "}
            {users.filter((user) => user.userType === "single").length}
          </div>
          <div>
            <strong>Family:</strong>{" "}
            {users.filter((user) => user.userType === "Family").length}
          </div>
        </div>
      </div>

      <div>
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search users by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control my-3"
        />
      </div>

      <div>
        {/* Table Header */}
        <div
          className="d-flex p-2 mb-2"
          style={{
            backgroundColor: "#f1f1f1",
            fontWeight: "bold",
            borderBottom: "2px solid #ddd",
          }}
        >
          <div style={{ flex: 1.5 }}>Full Name</div>
          <div style={{ flex: 1 }}>Spouse</div>
          <div style={{ flex: 1 }}>Total Amount</div>
          <div style={{ flex: 1.5 }}>Months Paid</div>
        </div>

        {/* Users List */}
        <div>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="d-flex align-items-center p-2 mb-2"
              style={{
                backgroundColor: "#fff",
                borderBottom: "1px solid #ddd",
              }}
            >
              {/* User Name */}
              <div style={{ flex: 1.5 }}>
                <h5
                  style={{
                    margin: 0,
                    borderBottom: "1px dotted #ccc",
                    width: "fit-content",
                  }}
                  onClick={() => toggleUserDetails(user.id)}
                >
                  {user.firstName} {user.lastName}
                </h5>
                {/* Expandable Details */}
                {expandedUsers[user.id] && (
                  <div
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "5px",
                      marginTop: "0.5rem",
                    }}
                  >
                    <p>
                      <strong>Full Name:</strong> {user.firstName}{" "}
                      {user.lastName}
                    </p>
                    <p>
                      <strong>Status:</strong> {user.userType}
                    </p>
                    <p>
                      <strong>Phone Number:</strong> {user.phoneNumber}
                    </p>
                    <p>
                      <strong>Address:</strong> {user.street}, {user.zipcode}{" "}
                      {user.city}
                    </p>
                  </div>
                )}
              </div>

              {/* Spouse Name */}
              <div style={{ flex: 1 }}>
                <p>{user.spouse}</p>
              </div>

              {/* User Total Amount */}
              <div style={{ flex: 1 }}>
                <p style={{ paddingLeft: "0.5rem" }}>
                  <strong>{user.totalAmountPaid}€</strong>
                </p>
              </div>

              {/* Months Paid */}
              <div style={{ flex: 1.5 }}>
                {/* Years */}
                {["2024", "2025", "2026"].map((year) => (
                  <div key={year} style={{ marginBottom: "0.5rem" }}>
                    {/* Year Header */}
                    <button
                      onClick={() =>
                        setExpandedYears((prev) => ({
                          ...prev,
                          [user.id]: prev[user.id] === year ? null : year, // Toggle year for this user
                        }))
                      }
                      style={{
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "5px",
                        border: "none",
                        backgroundColor:
                          expandedYears[user.id] === year
                            ? "#0d6efd"
                            : "#f8f9fa", // Bootstrap primary color
                        color:
                          expandedYears[user.id] === year ? "white" : "black",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        transition: "background-color 0.3s, color 0.3s",
                      }}
                    >
                      {year}
                    </button>

                    {/* Months (Only show if the year is expanded) */}
                    {expandedYears[user.id] === year && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.2rem",
                          marginTop: "0.3rem",
                        }}
                      >
                        {MONTHS_ORDER.map((month) => (
                          <span
                            key={month}
                            style={{
                              padding: "0.2rem 0.5rem",
                              margin: "0.2rem",
                              backgroundColor:
                                user.monthsPaid[year]?.[month] === true
                                  ? "green"
                                  : "red",
                              color: "white",
                              borderRadius: "3px",
                              fontSize: "0.8rem",
                            }}
                          >
                            {month.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserListReadOnly;
