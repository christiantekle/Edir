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
  const [expandedUsers, setExpandedUsers] = useState({}); // Track the expanded user
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    userType: "single",
    monthsPaid: generateMonthsPaid(2024, 2030),
    totalAmountPaid: 0,
    street: "",
    zipcode: "",
    city: "",
  });
  const [showConfirmation, setShowConfirmation] = useState(false); // Confirmation modal for payment toggle
  const [monthToToggle, setMonthToToggle] = useState({
    year: null,
    month: null,
    user: null,
  }); // Store month, year, and user for confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Confirmation modal for delete
  const [userToDelete, setUserToDelete] = useState(null); // Store the user to delete

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
      const totalPaid = calculateTotal(newUser.monthsPaid, newUser.userType);
      const finalTotalAmountPaid = (newUser.totalAmountPaid || 0) + totalPaid;

      const userToSave = {
        ...newUser,
        totalAmountPaid: finalTotalAmountPaid,
      };

      const { data: insertedUser, error } = await supabase
        .from("users")
        .insert([userToSave])
        .select();

      if (error) throw error;

      setUsers([...users, insertedUser[0]]);
      setShowAdd(false);
      setNewUser({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        userType: "single",
        monthsPaid: generateMonthsPaid(2024, 2030),
        totalAmountPaid: 0,
        street: "",
        zipcode: "",
        city: "",
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

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      // Update the local state
      const updatedUsers = users.filter((user) => user.id !== userToDelete.id);
      setUsers(updatedUsers);
    } catch (err) {
      console.error("Error deleting user", err);
      alert("Error deleting user. Please try again.");
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
          street: currentUser.street,
          zipcode: currentUser.zipcode,
          city: currentUser.city,
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

  const handleMonthClick = (user, year, month) => {
    // Store the month, year, and user in state
    setMonthToToggle({ year, month, user });
    // Show the confirmation modal
    setShowConfirmation(true);
  };

  const confirmToggleMonthPayment = async () => {
    const { user, year, month } = monthToToggle;

    // Clone the existing `monthsPaid` object for immutability
    const updatedMonthsPaid = { ...user.monthsPaid };

    // Ensure the year exists in the object
    if (!updatedMonthsPaid[year]) updatedMonthsPaid[year] = {};

    // Toggle the selected month's value
    const wasPaid = updatedMonthsPaid[year][month];
    updatedMonthsPaid[year][month] = !wasPaid;

    // Calculate the change in total based on the toggled month
    const monthlyRate = user.userType === "single" ? 7.5 : 10;
    const change = wasPaid ? -monthlyRate : monthlyRate;

    // Update the total amount paid
    const updatedTotalAmountPaid = user.totalAmountPaid + change;

    try {
      // Update the user in the database
      const { error } = await supabase
        .from("users")
        .update({
          monthsPaid: updatedMonthsPaid,
          totalAmountPaid: updatedTotalAmountPaid,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update the local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                monthsPaid: updatedMonthsPaid,
                totalAmountPaid: updatedTotalAmountPaid,
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

  const toggleUserDetails = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId], // Toggle the expanded state for this user
    }));
  };

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
              <div style={{ flex: 2, marginRight: "2rem" }}>
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
                            onClick={() => handleMonthClick(user, year, month)}
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
                <Button
                  variant="danger"
                  onClick={() => {
                    setUserToDelete(user); // Store the user to delete
                    setShowDeleteConfirmation(true); // Show the confirmation modal
                  }}
                >
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
                <option value="Single">Single</option>
                <option value="Family">Family</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Street</Form.Label>
              <Form.Control
                type="text"
                value={newUser.street}
                onChange={(e) =>
                  setNewUser({ ...newUser, street: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Zipcode</Form.Label>
              <Form.Control
                type="text"
                value={newUser.zipcode}
                onChange={(e) =>
                  setNewUser({ ...newUser, zipcode: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                value={newUser.city}
                onChange={(e) =>
                  setNewUser({ ...newUser, city: e.target.value })
                }
              />
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
              <Form.Label>Street</Form.Label>
              <Form.Control
                type="text"
                value={currentUser?.street || ""}
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, street: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Zipcode</Form.Label>
              <Form.Control
                type="text"
                value={currentUser?.zipcode || ""}
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, zipcode: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                value={currentUser?.city || ""}
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, city: e.target.value })
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
      {/* Confirmation Modal for Payment Toggle */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to toggle the payment status for{" "}
          {monthToToggle.month} {monthToToggle.year}?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmation(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowConfirmation(false);
              confirmToggleMonthPayment();
            }}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Confirmation Modal for Delete */}
      <Modal
        show={showDeleteConfirmation}
        onHide={() => setShowDeleteConfirmation(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the user{" "}
          <strong>
            {userToDelete?.firstName} {userToDelete?.lastName}
          </strong>
          ?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirmation(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setShowDeleteConfirmation(false);
              confirmDeleteUser();
            }}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserList;
