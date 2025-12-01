import { Request, Response } from 'express';
import { db } from './firestore';
import axios from 'axios';

export const syncComments = async (req: Request, res: Response) => {
    const { pageId } = req.body;

    if (!pageId) {
        return res.status(400).json({ error: 'pageId is required' });
    }

    try {
        console.log(`Syncing comments for page ${pageId}...`);

        // 1. Get Page Token
        const pageDoc = await db.collection('pages').doc(pageId).get();
        if (!pageDoc.exists) {
            return res.status(404).json({ error: 'Page not found' });
        }
        const pageToken = pageDoc.data()?.pageToken;
        if (!pageToken) {
            return res.status(400).json({ error: 'Page has no access token' });
        }

        // 2. Fetch Posts and Comments from Facebook
        // Fetching the last 20 posts and their comments
        const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
            params: {
                access_token: pageToken,
                fields: 'id,comments{id,message,from,created_time,is_hidden,parent}',
                limit: 20
            }
        });

        const posts = response.data.data || [];
        let count = 0;
        const activeCommentIds = new Set<string>();

        for (const post of posts) {
            if (post.comments && post.comments.data) {
                for (const comment of post.comments.data) {
                    activeCommentIds.add(comment.id);

                    const commentData = {
                        commentId: comment.id,
                        pageId: pageId,
                        postId: post.id,
                        message: comment.message || '',
                        fromId: comment.from?.id || 'unknown',
                        fromName: comment.from?.name || 'Unknown',
                        createdAt: new Date(comment.created_time),
                        status: comment.is_hidden ? 'hidden' : 'visible',
                        isDeleted: false,
                        lastSyncedAt: new Date()
                    };

                    await db.collection('comments').doc(comment.id).set(commentData, { merge: true });
                    count++;
                }
            }
        }

        // Mark comments not in activeCommentIds as deleted
        const allCommentsSnapshot = await db.collection('comments')
            .where('pageId', '==', pageId)
            .get();

        let deletedCount = 0;
        for (const doc of allCommentsSnapshot.docs) {
            const commentId = doc.data().commentId;
            if (!activeCommentIds.has(commentId) && !doc.data().isDeleted) {
                await db.collection('comments').doc(doc.id).update({
                    isDeleted: true,
                    deletedAt: new Date()
                });
                deletedCount++;
            }
        }

        console.log(`Synced ${count} comments for page ${pageId}, marked ${deletedCount} as deleted`);
        res.status(200).json({ message: 'Sync complete', count });

    } catch (error: any) {
        console.error('Error syncing comments:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to sync comments: ' + (error.message || 'Unknown error') });
    }
};
