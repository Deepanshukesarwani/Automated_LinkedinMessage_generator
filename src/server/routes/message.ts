import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();
export const messageRouter = express.Router();

const profileSchema = z.object({
  name: z.string(),
  job_title: z.string(),
  company: z.string(),
  location: z.string(),
  summary: z.string()
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // Make sure this key is for Anthropic, not OpenAI
});

messageRouter.post('/', async (req, res) => {
  try {
    const profile = profileSchema.parse(req.body);

    console.log('Generating personalized message for profile:', profile);

    const chatResponse = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // or claude-3-sonnet-20240229
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `Generate a personalized LinkedIn outreach message based on this profile:
Name: ${profile.name}
Job Title: ${profile.job_title}
Company: ${profile.company}
Location: ${profile.location}
Summary: ${profile.summary}

The message should be professional, friendly, and mention how our campaign management system can help them with their outreach efforts.`
        }
      ]
    });

    const aiMessage = chatResponse.content[0].text;

    console.log('Generated message:', aiMessage);
    res.json({ message: aiMessage });

  } catch (error: any) {
    console.error('Error generating message:', error);
    res.status(400).json({ error: error?.message || 'Failed to generate message' });
  }
});
