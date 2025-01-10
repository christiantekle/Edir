require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5001;

//Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

app.use(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = data.user; //attach user info to the req obj
  next();
});

//API routes for CRUD
app.get("/users", async (req, res) => {
  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) throw error;
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//POST route to add a user
app.post("/users", async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, totalAmountPaid } = req.body;
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([{ firstName, lastName, phoneNumber, totalAmountPaid }])
      .select();
    if (error) throw error;
    res.status(201).json(newUser[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//PUT route to update a user
app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, totalAmountPaid } = req.body;
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ firstName, lastName, phoneNumber, totalAmountPaid })
      .eq("id", id)
      .select();
    if (error) throw error;
    res.json(updatedUser[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//delete route to delete a user
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//Listen for requests
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
