import { db } from './firestore';
import { moderateContent } from './aiModeration';
import axios from 'axios';

interface CommentData {
    commentId: string;
    pageId: string;
    content: string;
    authorId: string;
    postId?: string;
}

interface Rule {
    ruleId: string;
    type: 'block' | 'auto-reply' | 'hide';
    keyword?: string;
    replyText?: string;
    isEnabled: boolean;
}

export const processComment = async (comment: CommentData) => {
    console.log(`Processing comment ${comment.commentId} for page ${comment.pageId}`);

    try {
        // 1. Fetch active rules for this page
        const rulesSnapshot = await db.collection('rules')
            .where('pageId', '==', comment.pageId)
            .where('isEnabled', '==', true)
            .get();

        const rules = rulesSnapshot.docs.map(doc => doc.data() as Rule);
        let actionTaken = false;

        // 2. Check Keyword Rules
        for (const rule of rules) {
            if (rule.keyword && comment.content.toLowerCase().includes(rule.keyword.toLowerCase())) {
                console.log(`Rule matched: ${rule.type} for keyword "${rule.keyword}"`);

                await applyRuleAction(comment, rule);
                actionTaken = true;

                // Log the action
                await logAction(comment, rule.type, rule.ruleId);

                if (rule.type === 'block' || rule.type === 'hide') break; // Stop processing if hidden/blocked
            }
        }

        // 3. AI Moderation (if no blocking rule matched yet)
        if (!actionTaken) {
            const aiResult = await moderateContent(comment.content);
            if (aiResult.flagged) {
                console.log(`AI Moderation flagged comment: ${aiResult.categories.join(', ')}`);
                // Auto-hide flagged content
                await hideComment(comment.commentId, comment.pageId);
                await logAction(comment, 'hide', 'ai-moderation');
            }
        }

    } catch (error) {
        console.error('Error processing comment:', error);
    }
};

const applyRuleAction = async (comment: CommentData, rule: Rule) => {
    switch (rule.type) {
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
            return pageDoc.data()?.accessToken || null;
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

        // Call Facebook Graph API to hide comment
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${commentId}`,
            { is_hidden: true },
            { params: { access_token: accessToken } }
        );

        console.log(`✅ Comment ${commentId} hidden on Facebook`);

        // Update status in Firestore
        await db.collection('comments').doc(commentId).update({
            status: 'hidden',
            moderatedBy: 'auto-rule',
            hiddenAt: new Date()
        });
    } catch (error: any) {
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
        await db.collection('logs').add({
            commentId: commentId,
            pageId: pageId,
            actionType: 'reply',
            replyText: text,
            replyId: response.data.id,
            timestamp: new Date()
        });
    } catch (error: any) {
        console.error(`Error replying to comment ${commentId}:`, error.response?.data || error.message);
    }
};

const logAction = async (comment: CommentData, actionType: string, ruleId: string) => {
    await db.collection('logs').add({
        commentId: comment.commentId,
        pageId: comment.pageId,
        ruleId: ruleId,
        userId: 'system',
        actionType: actionType,
        timestamp: new Date()
    });
};
