const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject'],
    },
    time: {
        type: String,
        required: [true, 'Please add a time'],
    },
    description: {
        type: String,
        default: '',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    userId: {
        type: String,
        default: 'anonymous', // For now, since we don't have auth yet
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Task', TaskSchema);
