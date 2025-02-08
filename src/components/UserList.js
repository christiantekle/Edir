import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const generateMonthsPaid = (startYear, endYear) => {
  const result = {};
  for (let year = startYear; year <= endYear; year++) {
    result[year] = {
      January: false,
      February: false,
      March: false,
      April: false,
      May: false,
      June: false,
      July: false,
      August: false,
      September: false,
      October: false,
      November: false,
      December: false,
    };
  }
  return result;
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [showEdit, setShowEdit] = useState(false); //show or hide the modal ----for edit
  const [showAdd, setShowAdd] = useState(false); //show or hide the modal --- to add a user
  const [currentUser, setCurrentUser] = useState(null); // being edited
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedYears, setExpandedYears] = useState({}); // Track the expanded year
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    userType: "single",
    monthsPaid: generateMonthsPaid(2024, 2030),
    totalAmountPaid: 0,
  });

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

  const saveNewUser = async () => {
    try {
      // Calculate the total amount paid based on the selected months
      const totalPaid = calculateTotal(newUser.monthsPaid, newUser.userType);

      // Add the manually entered amount to the calculated total
      const finalTotalAmountPaid = (newUser.totalAmountPaid || 0) + totalPaid;

      // Add the total amount to the new user object
      const userToSave = {
        ...newUser,
        totalAmountPaid: finalTotalAmountPaid, // Use the accumulated total
      };

      // Save the user to the database
      const { data: insertedUser, error } = await supabase
        .from("users")
        .insert([userToSave])
        .select();

      if (error) throw error;

      // Update the local state with the new user
      setUsers([...users, insertedUser[0]]);

      // Reset the form and close the modal
      setShowAdd(false);
      setNewUser({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        userType: "single",
        monthsPaid: generateMonthsPaid(2024, 2030), // Reset monthsPaid
        totalAmountPaid: 0,
      });
    } catch (err) {
      console.error("Error adding user", err);
      alert("Error adding user. Please try again.");
    }
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setShowEdit(true);
  };

  const handleAdd = () => {
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const { error } = await supabase.from("users").delete().eq("id", id);
        if (error) throw error;

        const updatedUsers = users.filter((user) => user.id !== id);
        setUsers(updatedUsers);
      } catch (err) {
        console.error("Error deleting user", err);
        alert("Error deleting user. Please try again.");
      }
    }
  };

  const saveEdit = async () => {
    try {
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          phoneNumber: currentUser.phoneNumber,
          totalAmountPaid: currentUser.totalAmountPaid,
        })
        .eq("id", currentUser.id)
        .select();
      if (error) throw error;

      const updatedUsers = users.map((user) =>
        user.id === currentUser.id ? updatedUser[0] : user
      );
      setUsers(updatedUsers);
      setShowEdit(false);
    } catch (err) {
      console.error("Error updating user", err);
      alert("Error updating user. Please try again.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      user.phoneNumber?.toString().includes(search) ||
      user.totalAmountPaid.toString().includes(search)
    );
  });

  const toggleMonthPayment = async (user, year, month) => {
    // Clone the existing `monthsPaid` object for immutability
    const updatedMonthsPaid = { ...user.monthsPaid };

    // Ensure the year exists in the object
    if (!updatedMonthsPaid[year]) updatedMonthsPaid[year] = {};

    // Toggle the selected month's value
    updatedMonthsPaid[year][month] = !updatedMonthsPaid[year][month];

    // Calculate the new total based on the updated `monthsPaid`
    const totalPaid = calculateTotal(updatedMonthsPaid, user.userType);

    try {
      // Update the user in the database
      const { error } = await supabase
        .from("users")
        .update({ monthsPaid: updatedMonthsPaid, totalAmountPaid: totalPaid })
        .eq("id", user.id);

      if (error) throw error;

      // Update the local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                monthsPaid: updatedMonthsPaid,
                totalAmountPaid: totalPaid,
              }
            : u
        )
      );
    } catch (err) {
      console.error("Error updating payment status", err);
      alert("Error updating payment status. Please try again.");
    }
  };

  const calculateTotal = (monthsPaid, userType) => {
    const monthlyRate = userType === "single" ? 7.5 : 10;
    let total = 0;

    Object.values(monthsPaid || {}).forEach((year) => {
      Object.values(year || {}).forEach((isPaid) => {
        if (isPaid) total += monthlyRate;
      });
    });

    return total;
  };

  const totalPaid = users.reduce((sum, user) => sum + user.totalAmountPaid, 0);

  return (
    <div>
      <Button variant="success" onClick={handleAdd} className="ms-auto d-block">
        Add New User
      </Button>
      <p className="mt-3">
        <strong>Total Paid by All Users: </strong>
        {totalPaid} Euros
      </p>
      <div>
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search users by name, phone..."
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
          <div style={{ flex: 2 }}>Name</div>
          {/* <div style={{ flex: 1 }}>Phone</div> */}
          <div style={{ flex: 1 }}>Total Amount</div>
          <div style={{ flex: 2 }}>Add Payment</div>
          <div style={{ flex: 1 }}>Actions</div>
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
              <div style={{ flex: 2 }}>
                <h5>
                  {user.firstName} {user.lastName}
                </h5>
              </div>
              {/* User Phone */}
              {/* <div style={{ flex: 1 }}>
                <p>{user.phoneNumber}</p>
              </div> */}
              {/* User Total Amount */}
              <div style={{ flex: 1 }}>
                <p>{user.totalAmountPaid}€</p>
              </div>
              {/* Add Payment */}

              <div style={{ flex: 2 }}>
                {/* Years */}
                {["2024", "2025"].map((year) => (
                  <div key={year} style={{ marginBottom: "1rem" }}>
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
                          gap: "0.5rem",
                          marginTop: "0.5rem",
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
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              toggleMonthPayment(user, year, month)
                            }
                          >
                            {month.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ flex: 1 }} className="d-flex gap-2">
                <Button variant="warning" onClick={() => handleEdit(user)}>
                  <FaEdit />
                </Button>
                <Button variant="danger" onClick={() => handleDelete(user.id)}>
                  <FaTrash />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Add User Modal */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={newUser.firstName}
                onChange={(e) =>
                  setNewUser({ ...newUser, firstName: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={newUser.lastName}
                onChange={(e) =>
                  setNewUser({ ...newUser, lastName: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                value={newUser.phoneNumber}
                onChange={(e) =>
                  setNewUser({ ...newUser, phoneNumber: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>User Type</Form.Label>
              <Form.Select
                value={newUser.userType}
                onChange={(e) =>
                  setNewUser({ ...newUser, userType: e.target.value })
                }
              >
                <option value="single">Single</option>
                <option value="family">Family</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Months Paid</Form.Label>
              {["2024", "2025"].map((year) => (
                <div key={year} style={{ marginBottom: "1rem" }}>
                  {/* Year Header */}
                  <button
                    type="button" // Prevent form submission
                    onClick={() =>
                      setNewUser((prev) => ({
                        ...prev,
                        monthsPaid: {
                          ...prev.monthsPaid,
                          [year]: prev.monthsPaid[year] || {
                            January: false,
                            February: false,
                            March: false,
                            April: false,
                            May: false,
                            June: false,
                            July: false,
                            August: false,
                            September: false,
                            October: false,
                            November: false,
                            December: false,
                          },
                        },
                      }))
                    }
                    style={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "black",
                      textDecoration: "none",
                      border: "none",
                      background: "none",
                    }}
                  >
                    {year}
                  </button>

                  {/* Months Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)", // 6 months per row
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {MONTHS_ORDER.map((month) => (
                      <span
                        key={month}
                        style={{
                          padding: "0.25rem",
                          margin: "0.25rem",
                          backgroundColor:
                            newUser.monthsPaid[year]?.[month] === true
                              ? "green"
                              : "red",
                          color: "white",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setNewUser((prev) => ({
                            ...prev,
                            monthsPaid: {
                              ...prev.monthsPaid,
                              [year]: {
                                ...prev.monthsPaid[year],
                                [month]: !prev.monthsPaid[year]?.[month],
                              },
                            },
                          }))
                        }
                      >
                        {month.slice(0, 3)} {/* Short month name */}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Previously Paid</Form.Label>
              <Form.Control
                type="number"
                value={newUser.totalAmountPaid}
                onChange={(e) =>
                  setNewUser({ ...newUser, totalAmountPaid: +e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={saveNewUser}>
            Save User
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Edit user */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={currentUser?.firstName || ""}
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, firstName: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={currentUser?.lastName || ""}
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, lastName: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                value={currentUser?.phoneNumber || ""}
                onChange={(e) =>
                  setCurrentUser({
                    ...currentUser,
                    phoneNumber: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Total Amount Paid</Form.Label>
              <Form.Control
                type="number"
                value={currentUser?.totalAmountPaid || ""}
                onChange={(e) =>
                  setCurrentUser({
                    ...currentUser,
                    totalAmountPaid: +e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={saveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserList;
