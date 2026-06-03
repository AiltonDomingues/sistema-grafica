import { createRequestHandler } from '../dist/server/server.js';

export default async function handler(req, res) {
  const requestHandler = await createRequestHandler();
  return requestHandler(req, res);
}
