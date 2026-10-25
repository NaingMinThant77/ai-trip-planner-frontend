import { fetch } from 'expo/fetch';
import { ApiError, API_BASE_URL, getAuthToken } from './client';
import { AgentStreamEvent } from '../types/blocks';

type StreamInput = { message: string; conversationId?: string; tripId?: string };

const EVENT_NAMES = ['meta', 'text_delta', 'block', 'done', 'error'] as const;

/**
 * Opens the agent's SSE stream and reports each event as it arrives.
 *
 * Not axios: React Native's axios adapter buffers the whole body, which would turn a stream
 * into one lump at the end. `expo/fetch` exposes the response as a real `ReadableStream`.
 * Resolves when the stream ends; rejects with `ApiError` if the request itself fails.
 */
export async function streamAgentMessage(
  input: StreamInput,
  onEvent: (event: AgentStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const token = getAuthToken();

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(`${API_BASE_URL}/agent/stream`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });
  } catch {
    if (signal.aborted) return;
    throw new ApiError(`Cannot reach the server at ${API_BASE_URL}. Is the backend running?`, null);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  if (!response.body) {
    throw new ApiError('The assistant did not reply.', response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // SSE frames end with a blank line; keep any trailing partial frame for the next read.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const event = parseFrame(frame);
        if (event) onEvent(event);
      }
    }
  } catch (error) {
    if (signal.aborted) return;
    throw error instanceof ApiError
      ? error
      : new ApiError('The connection dropped before the reply finished.', null);
  }
}

function parseFrame(frame: string): AgentStreamEvent | null {
  let name = '';
  let data = '';
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) name = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!name || !data || !(EVENT_NAMES as readonly string[]).includes(name)) return null;

  try {
    return { event: name, data: JSON.parse(data) as unknown } as AgentStreamEvent;
  } catch {
    return null;
  }
}

async function readErrorMessage(response: Awaited<ReturnType<typeof fetch>>): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join('\n');
    if (typeof body.message === 'string') return body.message;
  } catch {
    // Fall through to the generic message.
  }
  return 'Something went wrong.';
}
