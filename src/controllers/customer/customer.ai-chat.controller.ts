// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Request, Response } from 'express';
import { streamAgentResponse } from '@/ai/agent';

/**
 * Customer AI Chat Controller
 * Handles streaming AI chat responses for the mobile app
 */
export class CustomerAIChatController {
  /**
   * Handle chat message with streaming response.
   *
   * STREAMING FLOW:
   * 1. Client sends POST request with { message: "user question" }
   * 2. We call streamAgentResponse() which returns a StreamTextResult IMMEDIATELY
   * 3. We call pipeTextStreamToResponse(res) which:
   *    - Sets Content-Type to 'text/plain; charset=utf-8'
   *    - Sets Transfer-Encoding to 'chunked'
   *    - Streams each text chunk to the response AS IT ARRIVES from the AI
   * 4. Client receives chunks in real-time and can display them progressively
   *
   * NOTE: We do NOT call runMasterAgent() here - that function is for CLI testing.
   * We directly use streamAgentResponse() and pipe its stream to HTTP response.
   *
   * POST /customer/ai/chat
   */
  chat = async (req: Request, res: Response): Promise<void> => {
    const { messages } = req.body;
    const customerId = req.customer?.id;

    if (!customerId) {
      res.status(401).json({ error: 'Customer not authenticated' });
      return;
    }

    try {
      // streamAgentResponse() returns StreamTextResult IMMEDIATELY (synchronously)
      // The AI generation happens in the background and streams data over time
      const result = streamAgentResponse(messages, customerId);

      // pipeTextStreamToResponse() connects the AI's text stream to the HTTP response
      // Each text chunk from the AI is immediately written to the response
      // The client receives chunks in real-time via chunked transfer encoding
      // This method handles all the HTTP headers and streaming logic automatically
      result.pipeTextStreamToResponse(res);
    } catch (error) {
      console.error('[AI Chat Error]', error);

      // If headers haven't been sent yet, send error response
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to process chat message',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };
}

export default CustomerAIChatController;
