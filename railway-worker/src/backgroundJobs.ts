import * as cron from 'node-cron';
import { db } from './firestore';
import { processComment } from './ruleEngine';

// Delete logs older than 30 days
export const cleanupOldLogs = async () => {
    console.log('🧹 Running cleanup: Deleting old logs...');
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const oldLogsQuery = await db.collection('logs')
            .where('timestamp', '<', thirtyDaysAgo)
            .get();

        const batch = db.batch();
        let count = 0;

        oldLogsQuery.docs.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });

        if (count > 0) {
            await batch.commit();
            console.log(`✅ Deleted ${count} old log entries`);
        } else {
            console.log('✅ No old logs to delete');
        }
    } catch (error) {
        console.error('❌ Error cleaning up old logs:', error);
    }
};

// Recheck unmoderated comments (comments that haven't been processed)
export const recheckUnmoderatedComments = async () => {
    console.log('🔄 Rechecking unmoderated comments...');
    try {
        // Find comments that are visible but haven't been moderated
        const uncommentsQuery = await db.collection('comments')
            .where('status', '==', 'visible')
            .where('moderatedBy', '==', null)
            .limit(50) // Process in batches
            .get();

        let count = 0;
        for (const doc of uncommentsQuery.docs) {
            const comment = doc.data();
            console.log(`Processing unmoderated comment: ${doc.id}`);

            await processComment({
                commentId: doc.id,
                pageId: comment.pageId,
                content: comment.content,
                authorId: comment.authorId,
                postId: comment.postId
            });

            count++;
        }

        console.log(`✅ Rechecked ${count} unmoderated comments`);
    } catch (error) {
        console.error('❌ Error rechecking unmoderated comments:', error);
    }
};

// Retry failed moderation actions
export const retryFailedActions = async () => {
    console.log('🔁 Retrying failed moderation actions...');
    try {
        // Find logs with failed actions (you could add a 'status' field to logs)
        const failedActionsQuery = await db.collection('logs')
            .where('status', '==', 'failed')
            .limit(20)
            .get();

        let count = 0;
        for (const doc of failedActionsQuery.docs) {
            const log = doc.data();

            // Get the comment
            const commentDoc = await db.collection('comments').doc(log.commentId).get();
            if (!commentDoc.exists) continue;

            const comment = commentDoc.data();
            if (!comment) continue;

            // Retry processing
            await processComment({
                commentId: log.commentId,
                pageId: log.pageId,
                content: comment.content || '',
                authorId: comment.authorId || 'unknown',
                postId: comment.postId
            });

            // Mark as retried
            await db.collection('logs').doc(doc.id).update({
                status: 'retried',
                retriedAt: new Date()
            });

            count++;
        }

        console.log(`✅ Retried ${count} failed actions`);
    } catch (error) {
        console.error('❌ Error retrying failed actions:', error);
    }
};

// Schedule cron jobs
export const initializeCronJobs = () => {
    console.log('⏰ Initializing cron jobs...');

    // Run cleanup daily at 2 AM
    cron.schedule('0 2 * * *', () => {
        console.log('⏰ Running scheduled cleanup job');
        cleanupOldLogs();
    });

    // Recheck unmoderated comments every 6 hours
    cron.schedule('0 */6 * * *', () => {
        console.log('⏰ Running scheduled recheck job');
        recheckUnmoderatedComments();
    });

    // Retry failed actions every 2 hours
    cron.schedule('0 */2 * * *', () => {
        console.log('⏰ Running scheduled retry job');
        retryFailedActions();
    });

    console.log('✅ Cron jobs initialized:');
    console.log('   - Cleanup old logs: Daily at 2 AM');
    console.log('   - Recheck unmoderated: Every 6 hours');
    console.log('   - Retry failed actions: Every 2 hours');
};

// Manual trigger endpoints (for testing)
export const runManualCleanup = async () => {
    await cleanupOldLogs();
    await recheckUnmoderatedComments();
    await retryFailedActions();
};
