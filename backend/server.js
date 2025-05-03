require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const cron = require("node-cron");
const sgMail = require("@sendgrid/mail");

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

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Authentication middleware
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = data.user; //attach user info to the req obj
  next();
});

// Endpoint to generate and email weekly report
app.get("/generate-weekly-report", async (req, res) => {
  try {
    // Query users from the past week
    const { data: users, error } = await supabase
      .from("users")
      .select("id, firstName, lastName, totalAmountPaid, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      )
      .lte("created_at", new Date().toISOString());

    if (error) throw error;

    // Generate CSV
    const csvContent = generateCsv(users);

    // Email configuration
    const msg = {
      to: process.env.REPORT_EMAIL, // e.g., "recipient@example.com"
      from: process.env.SENDER_EMAIL, // e.g., "no-reply@yourdomain.com"
      subject: "Weekly Users Report",
      text: "Please find the weekly users report attached.",
      attachments: [
        {
          content: Buffer.from(csvContent).toString("base64"),
          filename: `weekly_report_${
            new Date().toISOString().split("T")[0]
          }.csv`,
          type: "text/csv",
          disposition: "attachment",
        },
      ],
    };

    // Send email
    await sgMail.send(msg);

    res.json({ message: "Weekly report generated and emailed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    const {
      firstName,
      lastName,
      phoneNumber,
      userType,
      monthsPaid,
      totalAmountPaid,
      street,
      zipcode,
      city,
    } = req.body;

    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          firstName,
          lastName,
          phoneNumber,
          userType,
          monthsPaid,
          totalAmountPaid,
          street,
          zipcode,
          city,
        },
      ])
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
    const {
      firstName,
      lastName,
      phoneNumber,
      userType,
      monthsPaid,
      totalAmountPaid,
      street,
      zipcode,
      city,
    } = req.body;

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        firstName,
        lastName,
        phoneNumber,
        userType,
        monthsPaid,
        totalAmountPaid,
        street,
        zipcode,
        city,
      })
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
