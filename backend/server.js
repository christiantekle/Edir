const express = require ('express');
const mongoose = require ('mongoose');
const cors = require ('cors');
const Users = require ('./models/Users');
require ('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

//Middleware
app.use(express.json());
app.use(cors());

//Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('MongoDB connection error: ', err));

//API routes for CRUD
app.get('/users', async (req, res) => {
    try {
        const users = await Users.find();
        res.json(users);
    }
    catch (err) {
        res.status(400).send('Server Error');
    }
});

//POST route to add a user
app.post('/users', async(req, res) => {
    try{
        const { firstName, lastName, phoneNumber, totalAmountPaid } = req.body;
        const newUser = new Users({ firstName, lastName, phoneNumber, totalAmountPaid });
        await newUser.save();
        res.status(201).json(newUser);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//PUT route to update a user
app.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phoneNumber, totalAmountPaid } = req.body;
        const updatedUser = { firstName, lastName, phoneNumber, totalAmountPaid };
        const user = await Users.findByIdAndUpdate(id, updatedUser, { new: true });
        res.json(user);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//delete route to delete a user
app.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Users.findByIdAndDelete(id);
        res.status(204).send();
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Listen for requests
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});