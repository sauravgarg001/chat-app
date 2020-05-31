const mongoose = require('mongoose')

const Schema = mongoose.Schema

let membersSubSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admin: {
        type: Boolean,
        default: false
    }
}, { _id: false });

let receiverSubSchema = new mongoose.Schema({
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    delivered: {
        type: Boolean,
        default: false
    },
    seen: {
        type: Boolean,
        default: false
    }
}, { _id: false });

let chatsSubSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    receiver: [receiverSubSchema],
    createdOn: {
        type: Date,
        default: Date.now
    },
    modifiedOn: {
        type: Date,
        default: Date.now
    }
});

let groupSchema = new Schema({

    groupId: {
        type: String,
        index: true,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    members: [membersSubSchema],
    chats: [chatsSubSchema],
    createdOn: {
        type: Date,
        default: Date.now
    },
    modifiedOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Group', groupSchema);