import express from 'express';
import validate from '@/middlewares/validate';
import aiChatValidation from '@/validations/ai-chat.validation';
import { CustomerAIChatController } from '@/controllers/customer/customer.ai-chat.controller';
import { authCustomer } from '@/middlewares/auth';

export default function createAIChatRoutes(): express.Router {
  const router = express.Router();

  const aiChatController = new CustomerAIChatController();

  /**
   * @swagger
   * tags:
   *   name: Customer AI Chat
   *   description: AI-powered chat assistant for customers
   */

  /**
   * @swagger
   * /customer/ai/chat:
   *   post:
   *     summary: Chat with AI assistant
   *     description: |
   *       Send a message to the AI assistant and receive a streaming response via Server-Sent Events (SSE).
   *       The response follows the standard SSE format.
   *
   *       **Streaming Response Format:**
   *       Each chunk is sent as an event prefixed with `data: ` and suffixed with `\n\n`.
   *       Example:
   *       `data: Hello\n\n`
   *       `data: World\n\n`
   *       `data: [DONE]\n\n` (when finished)
   *
   *       **React Native Implementation:**
   *       Use an EventSource client or handle the raw stream parsing manually by looking for `data:` prefixes.
   *     tags: [Customer AI Chat]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - messages
   *             properties:
   *               messages:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     role:
   *                       type: string
   *                       enum: [user, assistant, system]
   *                     content:
   *                       type: string
   *                 description: Conversation history including the new user message
   *                 example:
   *                   - role: "user"
   *                     content: "What rooms are available?"
   *     responses:
   *       200:
   *         description: Streaming AI response (Server-Sent Events)
   *         content:
   *           text/event-stream:
   *             schema:
   *               type: string
   *               description: SSE stream of text chunks
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Failed to process chat message"
   *                 message:
   *                   type: string
   *                   example: "Connection timeout"
   */
  router.post('/chat', authCustomer, validate(aiChatValidation.chat), aiChatController.chat);

  return router;
}
