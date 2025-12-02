import { db } from './firestore';
import { moderateContent } from './aiModeration';
import axios from 'axios';

interface CommentData {
    commentId: string;
    pageId: string;
    message: string;
    fromId: string;
    postId?: string;
}

interface Rule {
    id: string; // Firestore document ID
    name: string;
    triggerType: 'keyword' | 'ai';
    action: 'block' | 'auto-reply' | 'hide';
    keywords?: string[];
    replyText?: string;
    enabled: boolean;
}

export const processComment = async (comment: CommentData) => {
    console.log(`Processing comment ${comment.commentId} for page ${comment.pageId}`);

    try {
        // 1. Fetch active rules for this page
        const rulesSnapshot = await db.collection('rules')
            .where('pageId', '==', comment.pageId)
            .where('enabled', '==', true)
            .get();

        const rules = rulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rule));
        let actionTaken = false;

        // 2. Check Keyword Rules
        for (const rule of rules) {
            if (rule.triggerType === 'keyword' && rule.keywords && rule.keywords.length > 0) {
                const messageLower = comment.message.toLowerCase();
                const matchedKeyword = rule.keywords.find(k => messageLower.includes(k.toLowerCase()));

                if (matchedKeyword) {
                    console.log(`Rule matched: "${rule.name}" for keyword "${matchedKeyword}"`);

                    await applyRuleAction(comment, rule);
                    actionTaken = true;

                    // Log the action
                    await logAction(comment, rule.action, rule.id, `Matched keyword: ${matchedKeyword}`);

                    if (rule.action === 'block' || rule.action === 'hide') break; // Stop processing if hidden/blocked
                }
            }
        }

        // 3. AI Moderation (if no blocking rule matched yet)
        if (!actionTaken) {
            const aiResult = await moderateContent(comment.message);
            if (aiResult.flagged) {
                console.log(`AI Moderation flagged comment: ${aiResult.categories.join(', ')}`);
                // Auto-hide flagged content
                await hideComment(comment.commentId, comment.pageId);
                await logAction(comment, 'hide', 'ai-moderation', `AI flagged: ${aiResult.categories.join(', ')}`);
            }
        }

    } catch (error) {
        console.error('Error processing comment:', error);
    }
};

const applyRuleAction = async (comment: CommentData, rule: Rule) => {
    switch (rule.action) {
        case 'hide':
        case 'block':
            await hideComment(comment.commentId, comment.pageId);
            break;
        case 'auto-reply':
            if (rule.replyText) {
                await replyToComment(comment.commentId, comment.pageId, rule.replyText);
            }
            break;
    }
};

// Get page access token from Firestore
const getPageAccessToken = async (pageId: string): Promise<string | null> => {
    try {
        const pageDoc = await db.collection('pages').doc(pageId).get();
        if (pageDoc.exists) {
            return pageDoc.data()?.pageToken || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting page access token:', error);
        return null;
    }
};

const hideComment = async (commentId: string, pageId: string) => {
    try {
        const accessToken = await getPageAccessToken(pageId);

        if (!accessToken) {
            console.warn(`No access token found for page ${pageId}, cannot hide comment`);
            return;
        }

        // Call Facebook Graph API to hide comment (using query params, not body)
        await axios.post(
            `https://graph.facebook.com/v18.0/${commentId}`,
            null,
            {
                params: {
                    is_hidden: true,
                    access_token: accessToken
                }
            }
        );

        console.log(`✅ Comment ${commentId} hidden on Facebook`);

        // Update status in Firestore
        await db.collection('comments').doc(commentId).update({
            status: 'hidden',
            actionTaken: 'ai-hide',
            lastModeratedAt: new Date()
        });
    } catch (error: any) {
        // Handle "already hidden" error gracefully
        if (error.response?.data?.error?.error_subcode === 1446036) {
            console.log(`Comment ${commentId} is already hidden on Facebook, updating Firestore...`);
            await db.collection('comments').doc(commentId).update({
                status: 'hidden',
                actionTaken: 'ai-hide',
                lastModeratedAt: new Date()
            });
            return;
        }

        console.error(`Error hiding comment ${commentId}:`, error.response?.data || error.message);
    }
};

const replyToComment = async (commentId: string, pageId: string, text: string) => {
    try {
        const accessToken = await getPageAccessToken(pageId);

        if (!accessToken) {
            console.warn(`No access token found for page ${pageId}, cannot reply to comment`);
            return;
        }

        // Call Facebook Graph API to reply to comment
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${commentId}/comments`,
            { message: text },
            { params: { access_token: accessToken } }
        );

        console.log(`✅ Replied to comment ${commentId}: "${text}"`);

        // Log the reply
        await db.collection('actionLogs').add({
            commentId: commentId,
            pageId: pageId,
            action: 'reply',
            text: text,
            timestamp: new Date(),
            performedBy: 'system'
        });
    } catch (error: any) {
        console.error(`Error replying to comment ${commentId}:`, error.response?.data || error.message);
    }
};

const logAction = async (comment: CommentData, action: string, ruleId: string, text?: string) => {
    await db.collection('actionLogs').add({
        commentId: comment.commentId,
        pageId: comment.pageId,
        ruleId: ruleId,
        performedBy: 'system',
        action: action,
        text: text || '',
        timestamp: new Date()
    });
};
