import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';

export class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async sendMessage(prompt, maxTokens = 4096) {
    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      logger.error('Claude API error:', error);
      throw new Error('Failed to get response from Claude API');
    }
  }

  async parseJSON(response) {
    try {
      // Extract JSON from response (handles cases where Claude adds explanation text)
      const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('JSON parse error:', error);
      throw new Error('Failed to parse Claude response as JSON');
    }
  }
}
