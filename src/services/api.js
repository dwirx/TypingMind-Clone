// services/api.js
import OpenAI from 'openai';

export const createChatCompletion = async (messages, apiKey, modelId, isStreaming = false, signal) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      "HTTP-Referer": window.location.origin,
      "X-Title": "Chat App",
    },
  });

  try {
    const completion = await openai.chat.completions.create({
      model: modelId,
      messages: messages.map(({ role, content }) => ({ role, content })),
      stream: isStreaming,
    }, { signal });

    if (isStreaming) {
      const reader = completion.body.getReader();
      const decoder = new TextDecoder();
      const stream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(chunk);
          }
          controller.close();
        }
      });
      return stream;
    }

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No choices returned from the API');
    }

    return completion.choices[0].message;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("Error in createChatCompletion:", error);
      if (error.response) {
        console.error("API response:", error.response.data);
      }
    }
    throw new Error(`Failed to get chat completion: ${error.message}`);
  }
};

export const fetchApiUsage = async (apiKey) => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch API usage data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching API usage:', error);
    throw error;
  }
};
