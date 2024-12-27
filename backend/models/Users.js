const mongoose  = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    phoneNumber: String,
    totalAmountPaid: { type: Number, default: 0 },
});

const Users = mongoose.model('users', userSchema);

module.exports = Users;