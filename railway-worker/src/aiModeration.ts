import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
    flagged: boolean;
    categories: string[];
    confidence: number;
}

export const moderateContent = async (text: string): Promise<ModerationResult> => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY not set. Skipping AI moderation.');
            return { flagged: false, categories: [], confidence: 0 };
        }

        const response = await openai.moderations.create({
            input: text,
        });

        const result = response.results[0];
        const categories = Object.keys(result.categories).filter(
            (key) => result.categories[key as keyof typeof result.categories]
        );

        return {
            flagged: result.flagged,
            categories: categories,
            confidence: Math.max(...Object.values(result.category_scores)),
        };
    } catch (error) {
        console.error('Error in AI moderation:', error);
        // Fail safe: don't flag if error
        return { flagged: false, categories: [], confidence: 0 };
    }
};
