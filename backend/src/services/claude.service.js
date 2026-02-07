import OpenAI from 'openai';
import logger from '../utils/logger.js';
import { AI_CONFIG, OPENAI_MODELS } from '../config/constants.js';

export class ClaudeService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async sendMessage(prompt, maxTokens = 4096) {
    try {
      // Using gpt-4o for high accuracy email classification
      // More expensive than gpt-4o-mini but provides Claude-level classification accuracy
      const completion = await this.client.chat.completions.create({
        model: OPENAI_MODELS.CLASSIFICATION,
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: AI_CONFIG.CLASSIFICATION_TEMPERATURE
      });

      return completion.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new Error('Failed to get response from OpenAI API');
    }
  }

  async parseJSON(response) {
    try {
      // Extract JSON from response (handles cases where the model adds explanation text)
      const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('JSON parse error:', error);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  }
}
