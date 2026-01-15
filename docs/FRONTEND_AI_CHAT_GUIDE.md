# Frontend Integration Guide: AI Chat & History Management

## Overview

The RoomMaster AI Chat backend (`POST /v1/customer/ai/chat`) is **stateless**. This means the server **does not** save the conversation history in a database.

**The Frontend is responsible for maintaining and persisting the conversation state.**

## Responsibilities of the Frontend

1.  **Store History**: You must save the array of messages (User + AI) in your local state (e.g., React Context, Redux, or component state) and optionally persist it to storage (e.g., AsyncStorage, LocalStorage) if you want it to survive app restarts.
2.  **Send Full Context**: For _every_ new user message, you must send the **entire conversation history** up to that point, plus the new message, to the backend.
3.  **Append Responses**: As the AI streams its response back, you must append this new message to your local history.

## API Endpoint

**URL**: `POST /v1/customer/ai/chat`
**Content-Type**: `application/json`

### Request Body Format

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, I am John."
    },
    {
      "role": "assistant",
      "content": "Hello John! How can I help you?"
    },
    {
      "role": "user",
      "content": "What is my name?"
    }
  ]
}
```

- **role**: Can be `'user'` (the customer) or `'assistant'` (the AI).
- **content**: The text content of the message.
- **messages**: The array **must** be ordered chronologically (oldest first).

## Implementation Example (Pseudo-React)

Here is a simplified example of how to handle the state and API call.

```javascript
import React, { useState } from 'react';

// 1. Initialize state with an empty array or load from storage
const [messages, setMessages] = useState([]);

const sendMessage = async (userText) => {
  // 2. Create the new user message object
  const newUserMessage = { role: 'user', content: userText };

  // 3. Update UI immediately with user message
  const newHistory = [...messages, newUserMessage];
  setMessages(newHistory);

  try {
    // 4. Send the ENTIRE history to the backend
    const response = await fetch('https://api.roommaster.com/v1/customer/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: newHistory // Sending full context
      })
    });

    // 5. Handle Streaming Response
    // The backend returns a stream. You need to read chunks and build the 'assistant' message.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiResponseText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      aiResponseText += chunk;

      // Update UI with partial AI response (streaming effect)
      setMessages([...newHistory, { role: 'assistant', content: aiResponseText }]);
    }
  } catch (error) {
    console.error('Chat failed', error);
  }
};
```

## handling Persistance (Optional)

If you want the chat to "remember" previous sessions when the user closes and re-opens the app:

1.  **Save**: Whenever `messages` changes, save `JSON.stringify(messages)` to `AsyncStorage` (React Native) or `localStorage` (Web).
2.  **Load**: On app startup, read from storage and `setMessages`.
3.  **Clear**: Provide a "Clear Chat" button to reset `messages` to `[]` if the user wants to start fresh.
