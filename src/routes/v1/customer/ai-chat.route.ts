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
   *       Send a message to the AI assistant and receive a streaming text response.
   *       The response is streamed as text/plain with chunked transfer encoding.
   *
   *       **Streaming Response Format:**
   *       The response is sent as a stream of text chunks. Clients should handle
   *       the response as a readable stream and process chunks as they arrive.
   *
   *       **React Native Implementation:**
   *       Use fetch with streaming support or EventSource-like libraries to consume the stream.
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
   *         description: Streaming AI response
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               description: Streaming text response from the AI
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
