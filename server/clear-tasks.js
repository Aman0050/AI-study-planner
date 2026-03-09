require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Task = require('./models/Task');
const StudyPlan = require('./models/StudyPlan');

async function clearOldData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const deletedTasks = await Task.deleteMany({ subject: 'english' }); // Or delete all with {}
        console.log(`Deleted ${deletedTasks.deletedCount} old "english" tasks.`);

        const deletedPlans = await StudyPlan.deleteMany({ subject: 'english' });
        console.log(`Deleted ${deletedPlans.deletedCount} old "english" study plans.`);

        console.log('Database successfully cleared of old english tasks! You can now generate a new, clean 7-day schedule.');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing data:', err);
        process.exit(1);
    }
}

clearOldData();
