import { Request, Response } from 'express';
import { db } from './firestore';
import axios from 'axios';

export const moderateComment = async (req: Request, res: Response) => {
    const { commentId, action } = req.body;

    if (!commentId || !action) {
        return res.status(400).json({ error: 'commentId and action are required' });
    }

    if (!['hide', 'unhide'].includes(action)) {
        return res.status(400).json({ error: 'action must be "hide" or "unhide"' });
    }

    try {
        // 1. Get comment from Firestore
        const commentDoc = await db.collection('comments').doc(commentId).get();
        if (!commentDoc.exists) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const commentData = commentDoc.data();
        const pageId = commentData?.pageId;

        if (!pageId) {
            return res.status(400).json({ error: 'Comment has no associated pageId' });
        }

        // 2. Get Page Access Token
        const pageDoc = await db.collection('pages').doc(pageId).get();
        if (!pageDoc.exists) {
            return res.status(404).json({ error: 'Page not found' });
        }

        const pageToken = pageDoc.data()?.pageToken;
        if (!pageToken) {
            return res.status(400).json({ error: 'Page has no access token' });
        }

        // 3. Call Facebook Graph API to hide/unhide
        const isHidden = action === 'hide';
        const fbCommentId = commentData?.commentId;

        if (!fbCommentId) {
            return res.status(400).json({ error: 'Comment has no Facebook comment ID' });
        }

        console.log(`Calling Facebook API to ${action} comment ${fbCommentId}...`);
        await axios.post(
            `https://graph.facebook.com/v18.0/${fbCommentId}`,
            null,
            {
                params: {
                    is_hidden: isHidden,
                    access_token: pageToken
                }
            }
        );
        console.log(`Facebook API call successful for comment ${fbCommentId}`);

        // 4. Update Firestore
        console.log(`Updating Firestore document ${commentId}...`);
        await db.collection('comments').doc(commentId).update({
            status: isHidden ? 'hidden' : 'visible',
            actionTaken: 'manual',
            lastModeratedAt: new Date()
        });
        console.log(`Firestore updated successfully for comment ${commentId}`);

        res.status(200).json({
            message: `Comment ${action}d successfully`,
            commentId,
            status: isHidden ? 'hidden' : 'visible'
        });

    } catch (error: any) {
        // Handle "already hidden" error gracefully (error_subcode 1446036)
        if (error.response?.data?.error?.error_subcode === 1446036) {
            console.log(`Comment ${commentId} is already ${action}d on Facebook, updating Firestore...`);
            // Comment is already in the desired state, update Firestore anyway
            const isHidden = action === 'hide';
            await db.collection('comments').doc(commentId).update({
                status: isHidden ? 'hidden' : 'visible',
                actionTaken: 'manual',
                lastModeratedAt: new Date()
            });

            return res.status(200).json({
                message: `Comment already ${action}d on Facebook`,
                commentId,
                status: isHidden ? 'hidden' : 'visible'
            });
        }

        // Only log actual errors
        console.error('Error moderating comment:', error.response?.data || error);
        res.status(500).json({
            error: 'Failed to moderate comment: ' + (error.response?.data?.error?.message || error.message)
        });
    }
};
