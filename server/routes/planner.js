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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
You are a study plan generator. Generate a detailed study plan in STRICT JSON format only.

Subject: "${subject}"
Goal: "${goal}"
Duration: ${duration} weeks

Return ONLY a valid JSON object with NO markdown, NO code blocks, NO extra text:
{
  "title": "Catchy plan title",
  "overview": "Brief 1-2 sentence overview",
  "modules": [
    {
      "name": "Module Name",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "time": "Week 1"
    }
  ]
}

Generate ${Math.max(3, parseInt(duration) * 2)} modules covering the full ${duration} week plan.`;

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

module.exports = router;
