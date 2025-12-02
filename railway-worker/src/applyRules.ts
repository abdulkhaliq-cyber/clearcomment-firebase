import { Request, Response } from 'express';
import { db } from './firestore';
import { processComment } from './ruleEngine';

export const applyRules = async (req: Request, res: Response) => {
    const { pageId } = req.body;

    if (!pageId) {
        return res.status(400).json({ error: 'pageId is required' });
    }

    try {
        console.log(`Applying rules to comments for page ${pageId}...`);

        // Fetch all visible comments for this page
        const commentsSnapshot = await db.collection('comments')
            .where('pageId', '==', pageId)
            .where('status', '==', 'visible')
            .get();

        console.log(`Found ${commentsSnapshot.docs.length} visible comments to process`);

        let processedCount = 0;
        let hiddenCount = 0;

        for (const doc of commentsSnapshot.docs) {
            const commentData = doc.data();

            // Process each comment through the rule engine
            await processComment({
                commentId: commentData.commentId,
                pageId: commentData.pageId,
                message: commentData.message || '',
                fromId: commentData.fromId || 'unknown',
                postId: commentData.postId
            });

            processedCount++;

            // Check if comment was hidden after processing
            const updatedDoc = await db.collection('comments').doc(doc.id).get();
            if (updatedDoc.data()?.status === 'hidden') {
                hiddenCount++;
            }
        }

        console.log(`Processed ${processedCount} comments, ${hiddenCount} were hidden`);
        res.status(200).json({
            message: 'Rules applied successfully',
            processedCount,
            hiddenCount
        });

    } catch (error: any) {
        console.error('Error applying rules:', error);
        res.status(500).json({
            error: 'Failed to apply rules: ' + (error.message || 'Unknown error')
        });
    }
};
