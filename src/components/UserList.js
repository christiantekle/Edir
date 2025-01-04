import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [showEdit, setShowEdit] = useState(false); //show or hide the modal ----for edit
  const [showAdd, setShowAdd] = useState(false); //show or hide the modal --- to add a user
  const [currentUser, setCurrentUser] = useState(null); // being edited
  const [searchTerm, setSearchTerm] = useState("");
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    totalAmountPaid: 0,
  });

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
      const { data: insertedUser, error } = await supabase
        .from("users")
        .insert([newUser])
        .select();
      if (error) throw error;
      setUsers([...users, insertedUser[0]]);
      setShowAdd(false);
      setNewUser({
        firstName: "",
        lastName: "",
        phoneNumber: "",
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

  const confirmAndPay = async (user, amount) => {
    if (
      window.confirm(
        `Are you sure you want to add $${amount} to ${user.firstName}'s total?`
      )
    ) {
      const updatedTotal = user.totalAmountPaid + amount;

      // Update the user in Supabase
      const { data, error } = await supabase
        .from("users")
        .update({ totalAmountPaid: updatedTotal })
        .eq("id", user.id); // Use the "id" column from your Supabase database schema

      if (error) {
        console.error("Error updating user", error);
        alert("Error updating user. Please try again.");
      } else {
        // Update state after successful update
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...user, totalAmountPaid: updatedTotal } : u
        );
        setUsers(updatedUsers);
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
          <div style={{ flex: 1 }}>Phone</div>
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
              <div style={{ flex: 1 }}>
                <p>{user.phoneNumber}</p>
              </div>

              {/* User Total Amount */}
              <div style={{ flex: 1 }}>
                <p>{user.totalAmountPaid}€</p>
              </div>

              {/* Add Payment */}
              <div style={{ flex: 2 }} className="d-flex gap-2">
                <Button
                  variant="outline-success"
                  onClick={() => confirmAndPay(user, 20)}
                >
                  +20€
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => confirmAndPay(user, 50)}
                >
                  +50€
                </Button>
              </div>

              {/* Actions (Edit/Delete) */}
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
              <Form.Label>Total Amount Paid</Form.Label>
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
