import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api`;

export const taskService = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/tasks`);
        return response.json();
    },
    create: async (taskData) => {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData),
        });
        return response.json();
    },
    update: async (id, taskData) => {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData),
        });
        if (!response.ok) throw new Error('Failed to update task');
        return response.json();
    },
    delete: async (id) => {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete task');
        return response.json();
    }
};

export const plannerService = {
    generate: async (plannerData) => {
        const response = await fetch(`${API_URL}/planner/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plannerData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate plan');
        }
        return response.json();
    },
    getAll: async () => {
        const response = await fetch(`${API_URL}/planner`);
        return response.json();
    }
};
