import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { verifyWebhook, handleWebhookEvent } from './facebookWebhook';
import { Worker } from 'bullmq';
import { processComment } from './ruleEngine';
import { initializeCronJobs, runManualCleanup } from './backgroundJobs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.get('/status', (req, res) => {
    res.status(200).send('OK');
});

app.get('/webhook/facebook', verifyWebhook);
app.post('/webhook/facebook', handleWebhookEvent);

// Manual trigger for background jobs (for testing/admin)
app.post('/admin/cleanup', async (req, res) => {
    try {
        await runManualCleanup();
        res.status(200).json({ message: 'Cleanup tasks completed' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);

    // Initialize cron jobs
    initializeCronJobs();
});

// Initialize Queue Worker
// Only start if Redis is configured
if (process.env.REDIS_HOST) {
    const redisConnection = {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
    };

    const worker = new Worker('comment-processing', async job => {
        console.log(`Processing job ${job.id}`);
        await processComment(job.data);
    }, { connection: redisConnection });

    worker.on('completed', job => {
        console.log(`Job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`Job ${job?.id} has failed with ${err.message}`);
    });

    console.log('✅ BullMQ worker started');
} else {
    console.log('⚠️  Redis not configured. Queue worker not started. Comments will be processed synchronously.');
}
