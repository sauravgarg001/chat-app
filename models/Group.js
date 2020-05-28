const mongoose = require('mongoose')

const Schema = mongoose.Schema

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
    members: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
            required: true,
            index: true
        },
        admin: {
            type: Boolean,
            default: false
        }
    }],
    chats: [{
        chatId: {
            type: String,
            unique: true,
            required: true,
            index: true
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
        receiverIds: [{
            receiver_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                unique: true,
                required: true,
                index: true
            },
            delivered: {
                type: Boolean,
                default: false
            },
            seen: {
                type: Boolean,
                default: false
            }
        }],
        createdOn: {
            type: Date,
            default: Date.now
        },
        modifiedOn: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model('Group', groupSchema);