const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// @desc    Get all tasks
// @route   GET /api/tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Create a task
// @route   POST /api/tasks
router.post('/', async (req, res) => {
    const task = new Task({
        title: req.body.title,
        subject: req.body.subject,
        time: req.body.time,
        date: req.body.date,
        description: req.body.description,
    });

    try {
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Update a task
// @route   PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (req.body.completed !== undefined) task.completed = req.body.completed;
        if (req.body.title) task.title = req.body.title;
        if (req.body.subject) task.subject = req.body.subject;
        if (req.body.time) task.time = req.body.time;
        if (req.body.description) task.description = req.body.description;

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Delete ALL tasks
// @route   DELETE /api/tasks
router.delete('/', async (req, res) => {
    try {
        await Task.deleteMany({});
        res.json({ message: 'All tasks deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await task.deleteOne();
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
