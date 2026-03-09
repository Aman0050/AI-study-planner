const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const StudyPlan = require('../models/StudyPlan');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Generate a study plan
// @route   POST /api/planner/generate
router.post('/generate', async (req, res) => {
    const { subject, goal, duration } = req.body;

    if (!subject || !goal || !duration) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Switching to gemini-2.5-flash to bypass per-model quota limits
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
You are a study plan generator. Generate a daily study plan for the requested duration.

Subject: "${subject}"
Goal: "${goal}"
Duration: ${duration} weeks (${duration * 7} days)

Return ONLY a valid JSON object with NO markdown, NO code blocks, NO extra text:
{
  "title": "Catchy Plan Title",
  "overview": "Brief 1-2 sentence overview",
  "modules": [
    {
      "name": "Daily Focus Topic",
      "topics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
      "dayOffset": 0,
      "time": "Day 1",
      "videoUrl": "https://www.youtube.com/results?search_query=specific+tutorial+for+this+topic"
    }
  ]
}

Generate exactly ${duration * 7} modules, representing one main task for each day of the study plan. 
- "dayOffset" must start at 0 for today, 1 for tomorrow, 2 for the next day, etc. 
- "videoUrl" must be a working YouTube search query URL specifically tailored to finding a video tutorial about the exact topics in the module. Do NOT invent fake direct video links, use the search query format.
- "time" should be the day description (e.g., "Day 1", "Day 2").
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Strip markdown code fences if present
        const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

        // Extract the JSON object
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) {
            return res.status(500).json({ message: 'AI returned an unexpected format. Please try again.' });
        }

        const planData = JSON.parse(match[0]);

        const studyPlan = new StudyPlan({
            title: planData.title,
            subject,
            goal,
            duration,
            overview: planData.overview,
            modules: planData.modules
        });

        const savedPlan = await studyPlan.save();
        res.status(201).json(savedPlan);
    } catch (err) {
        console.error('Planner Error:', err.message);
        res.status(500).json({ message: err.message || 'AI generation failed. Please try again.' });
    }
});

// @desc    Get all saved plans
// @route   GET /api/planner
router.get('/', async (req, res) => {
    try {
        const plans = await StudyPlan.find().sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const Task = require('../models/Task');

// @desc    Delete a study plan and its associated tasks
// @route   DELETE /api/planner/:id
router.delete('/:id', async (req, res) => {
    try {
        const plan = await StudyPlan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Optional: Delete all tasks associated with this subject
        // In a multi-user app, we'd filter by userId too
        await Task.deleteMany({ subject: plan.subject });

        await plan.deleteOne();
        res.json({ message: 'Plan and associated tasks deleted successfully' });
    } catch (err) {
        console.error('Delete Plan Error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
