import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { db } from './firestore';

dotenv.config();

// Queue for async processing
// Note: Requires Redis connection. If Redis is not available, we process synchronously.
let commentQueue: Queue | null = null;

if (process.env.REDIS_HOST || process.env.REDISHOST) {
    const redisConnection = {
        host: process.env.REDIS_HOST || process.env.REDISHOST,
        port: parseInt(process.env.REDIS_PORT || process.env.REDISPORT || '6379'),
        password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD,
    };

    try {
        commentQueue = new Queue('comment-processing', { connection: redisConnection });
        console.log('✅ BullMQ queue initialized with Redis');
    } catch (e) {
        console.warn('⚠️  Failed to initialize BullMQ queue:', e);
    }
} else {
    console.warn('⚠️  REDIS_HOST not set. Comments will be processed synchronously.');
}

// Verify Facebook signature
const verifySignature = (req: Request): boolean => {
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature || !process.env.FACEBOOK_APP_SECRET) {
        return false;
    }

    const elements = signature.split('=');
    const signatureHash = elements[1];

    const expectedHash = crypto
        .createHmac('sha256', process.env.FACEBOOK_APP_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signatureHash),
        Buffer.from(expectedHash)
    );
};

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
    // Verify request signature
    if (process.env.FACEBOOK_APP_SECRET && !verifySignature(req)) {
        console.error('Invalid signature');
        return res.sendStatus(403);
    }

    const body = req.body;

    if (body.object === 'page') {
        // Respond to Facebook immediately (required within 20 seconds)
        res.status(200).send('EVENT_RECEIVED');

        // Process events asynchronously
        for (const entry of body.entry) {
            if (entry.changes) {
                for (const change of entry.changes) {
                    // Handle comment events
                    if (change.field === 'feed' && change.value.item === 'comment') {
                        const commentData = {
                            commentId: change.value.comment_id,
                            pageId: entry.id,
                            postId: change.value.post_id || change.value.parent_id,
                            message: change.value.message || '',
                            fromId: change.value.from?.id || 'unknown',
                            fromName: change.value.from?.name || 'Unknown',
                            createdAt: new Date(change.value.created_time * 1000 || Date.now()),
                            verb: change.value.verb, // 'add', 'edit', 'remove'
                        };

                        // Skip if comment is being removed
                        if (commentData.verb === 'remove') {
                            console.log(`Comment ${commentData.commentId} removed, skipping processing`);
                            continue;
                        }

                        console.log('Received comment event:', commentData);

                        // Check for idempotency - don't process same comment twice
                        const existingComment = await db.collection('comments').doc(commentData.commentId).get();
                        if (existingComment.exists) {
                            console.log(`Comment ${commentData.commentId} already processed, skipping`);
                            continue;
                        }

                        // Store comment in Firestore (backend-only write)
                        await db.collection('comments').doc(commentData.commentId).set({
                            ...commentData,
                            status: 'visible',
                            actionTaken: null,
                            receivedAt: new Date(),
                        });

                        console.log(`Comment ${commentData.commentId} stored in Firestore`);

                        // Add to queue for processing or process synchronously
                        if (commentQueue) {
                            await commentQueue.add('process-comment', commentData);
                            console.log(`Comment ${commentData.commentId} added to queue`);
                        } else {
                            console.log('Processing comment synchronously');
                            const { processComment } = await import('./ruleEngine');
                            await processComment(commentData);
                        }
                    }
                }
            }
        }
    } else {
        res.sendStatus(404);
    }
};
