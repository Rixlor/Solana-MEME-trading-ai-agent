import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AgentCoordinationService } from './infrastructure/database/services/AgentCoordinationService.js';
import { logger } from './utils/logger.js';
export async function createServer() {
    const app = express();
    const agentCoordination = AgentCoordinationService.getInstance();
    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    // Error handling middleware
    app.use((err, req, res, next) => {
        logger.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });
    // Agent endpoints
    app.post('/agents', async (req, res) => {
        try {
            const agent = await agentCoordination.registerAgent(req.body);
            res.status(201).json(agent);
        }
        catch (error) {
            logger.error('Error registering agent:', error);
            res.status(500).json({ error: 'Failed to register agent' });
        }
    });
    app.post('/tasks', async (req, res) => {
        try {
            const { agentId, ...taskData } = req.body;
            const task = await agentCoordination.assignTask(taskData, agentId);
            res.status(201).json(task);
        }
        catch (error) {
            logger.error('Error creating task:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    });
    app.patch('/tasks/:taskId/status', async (req, res) => {
        try {
            const { taskId } = req.params;
            const { status, result } = req.body;
            await agentCoordination.updateTaskStatus(taskId, status, result);
            res.status(200).json({ message: 'Task status updated' });
        }
        catch (error) {
            logger.error('Error updating task status:', error);
            res.status(500).json({ error: 'Failed to update task status' });
        }
    });
    app.get('/agents/:agentId/metrics', async (req, res) => {
        try {
            const { agentId } = req.params;
            const metrics = await agentCoordination.getAgentMetrics(agentId);
            res.json(metrics);
        }
        catch (error) {
            logger.error('Error fetching agent metrics:', error);
            res.status(500).json({ error: 'Failed to fetch agent metrics' });
        }
    });
    return app;
}
