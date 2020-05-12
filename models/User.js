const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: '',
        index: true,
        unique: true
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: 'passskdajakdjkadsj'
    },
    email: {
        type: String,
        default: '',
        unique: true
    },
    mobileNumber: {
        type: Number,
        default: 0,
        unique: true
    },
    createdOn: {
        type: Date,
        default: ""
    }
});

module.exports = mongoose.model('User', userSchema);