import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';

dotenv.config();

// Queue for async processing
// Note: Requires Redis connection. If Redis is not available, this will fail.
// For local dev without Redis, we might want to bypass the queue.
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
};

let commentQueue: Queue | null = null;
try {
    commentQueue = new Queue('comment-processing', { connection: redisConnection });
} catch (e) {
    console.warn('Failed to initialize BullMQ queue. Redis might be missing.');
}

export const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
};

export const handleWebhookEvent = async (req: Request, res: Response) => {
    const body = req.body;

    if (body.object === 'page') {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging ? entry.messaging[0] : null;
            // Note: Facebook comment events structure varies (changes, feed, etc.)
            // This is a simplified handler for 'feed' changes or similar.

            if (entry.changes) {
                for (const change of entry.changes) {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        const commentData = {
                            commentId: change.value.comment_id,
                            pageId: entry.id,
                            content: change.value.message,
                            authorId: change.value.from.id,
                        };

                        console.log('Received new comment:', commentData);

                        // Add to queue for processing
                        if (commentQueue) {
                            await commentQueue.add('process-comment', commentData);
                        } else {
                            console.warn('Queue not available, processing synchronously (not recommended for production)');
                            // Fallback: import and run directly (circular dependency risk, handled dynamically)
                            const { processComment } = await import('./ruleEngine');
                            await processComment(commentData);
                        }
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
};
