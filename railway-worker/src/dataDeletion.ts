import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { db } from './firestore';

// Helper to decode base64url
const base64decode = (str: string) => {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
};

// Helper to verify Facebook signature
const parseSignedRequest = (signedRequest: string, appSecret: string) => {
    const [encodedSig, payload] = signedRequest.split('.');

    // Decode the signature
    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

    // Verify the signature
    const expectedSig = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest();

    if (!crypto.timingSafeEqual(sig, expectedSig)) {
        throw new Error('Invalid signature');
    }

    // Decode the payload
    const data = JSON.parse(base64decode(payload));
    return data;
};

export const handleDataDeletion = async (req: Request, res: Response) => {
    try {
        const signedRequest = req.body.signed_request;

        if (!signedRequest) {
            return res.status(400).json({ error: 'Missing signed_request' });
        }

        if (!process.env.FACEBOOK_APP_SECRET) {
            console.error('FACEBOOK_APP_SECRET is not set');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Verify and parse the request
        const data = parseSignedRequest(signedRequest, process.env.FACEBOOK_APP_SECRET);
        const userId = data.user_id;

        console.log(`Processing data deletion request for Facebook User ID: ${userId}`);

        // 1. Find the user in Firestore based on Facebook User ID
        // Note: You might need to store the Facebook User ID in your user document if you haven't already.
        // Assuming we can find the user or pages connected by this Facebook User ID.

        // Strategy: Find pages connected by this user and delete them + their comments/rules
        // This is a simplified deletion. In a real app, you'd want to be thorough.

        const pagesSnapshot = await db.collection('pages').where('connectedBy', '==', userId).get();

        const batch = db.batch();
        let operationCount = 0;

        // Delete pages and associated data
        for (const pageDoc of pagesSnapshot.docs) {
            const pageId = pageDoc.id;

            // Delete rules for this page
            const rulesSnapshot = await db.collection('rules').where('pageId', '==', pageId).get();
            rulesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                operationCount++;
            });

            // Delete comments for this page
            // Note: Deleting a huge number of comments in a batch might hit limits. 
            // For compliance, we should ideally use a background job, but for this callback we do a best effort.
            const commentsSnapshot = await db.collection('comments').where('pageId', '==', pageId).limit(500).get();
            commentsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                operationCount++;
            });

            // Delete the page document itself
            batch.delete(pageDoc.ref);
            operationCount++;
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        console.log(`Deleted ${operationCount} documents for user ${userId}`);

        // Return the confirmation code and status URL
        // Facebook expects a JSON response with 'url' and 'confirmation_code'
        const confirmationCode = crypto.randomBytes(10).toString('hex');

        // In a real app, you would store this confirmation code to allow the user to check status later.
        // For now, we'll return a static status URL (or point to the privacy policy).

        res.json({
            url: `${process.env.RAILWAY_PUBLIC_DOMAIN || 'https://clearcomment-7f6f8.web.app'}/privacy`,
            confirmation_code: confirmationCode,
        });

    } catch (error: any) {
        console.error('Error processing data deletion:', error);
        res.status(400).json({ error: 'Invalid request' });
    }
};
