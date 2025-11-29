import { db } from './firestore';
import { moderateContent } from './aiModeration';

interface CommentData {
    commentId: string;
    pageId: string;
    content: string;
    authorId: string;
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

const hideComment = async (commentId: string, pageId: string) => {
    // TODO: Call Facebook API to hide comment
    console.log(`[MOCK] Hiding comment ${commentId} on page ${pageId}`);

    // Update status in Firestore
    await db.collection('comments').doc(commentId).update({
        status: 'hidden',
        moderatedBy: 'auto-rule'
    });
};

const replyToComment = async (commentId: string, pageId: string, text: string) => {
    // TODO: Call Facebook API to reply
    console.log(`[MOCK] Replying to ${commentId}: "${text}"`);

    // Log reply in Firestore (optional, or just in logs)
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
