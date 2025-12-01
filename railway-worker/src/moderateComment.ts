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
        await axios.post(`https://graph.facebook.com/v18.0/${commentId}`, {
            is_hidden: isHidden
        }, {
            params: {
                access_token: pageToken
            }
        });

        // 4. Update Firestore
        await db.collection('comments').doc(commentId).update({
            status: isHidden ? 'hidden' : 'visible',
            actionTaken: 'manual',
            lastModeratedAt: new Date()
        });

        res.status(200).json({
            message: `Comment ${action}d successfully`,
            commentId,
            status: isHidden ? 'hidden' : 'visible'
        });

    } catch (error: any) {
        console.error('Error moderating comment:', error.response?.data || error);
        res.status(500).json({
            error: 'Failed to moderate comment: ' + (error.response?.data?.error?.message || error.message)
        });
    }
};
