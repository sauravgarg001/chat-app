const mongoose = require('mongoose')

const Schema = mongoose.Schema

let chatSchema = new Schema({

    chatId: {
        type: String,
        unique: true,
        required: true
    },
    senderName: {
        type: String,
        default: ''
    },
    senderId: {
        type: String,
        default: ''
    },
    receiverName: {
        type: String,
        default: ''
    },
    receiverId: {
        type: String,
        default: ''
    },
    message: {
        type: String,
        default: ''
    },
    seen: {
        type: Boolean,
        default: false
    },
    delivered: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    modifiedOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chat', chatSchema);