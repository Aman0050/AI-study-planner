const mongoose = require('mongoose');

const StudyPlanSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    goal: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    overview: {
        type: String,
    },
    modules: [{
        name: String,
        topics: [String],
        time: String,
        videoUrl: String,
        dayOffset: Number
    }],
    description: {
        type: String,
        default: '',
    },
    videoUrl: {
        type: String,
        default: '',
    },
    userId: {
        type: String,
        default: 'anonymous',
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
