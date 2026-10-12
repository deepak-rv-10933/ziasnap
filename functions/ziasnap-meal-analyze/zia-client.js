'use strict';

/**
 * Thin client for the deployed ZiaSnap Meal Analyzer agent (Zoho Zia Agents).
 * Auth comes from the Catalyst Connection named "agents" (service ZiaAgents,
 * scopes ZiaAgents.agents.TRIGGER + ZiaAgents.agents.ALL) — Catalyst manages
 * the OAuth token lifecycle, so no client secret/refresh token lives here.
 *
 * Non-secret config still comes from function env vars (Console/catalyst-config.json):
 *   ZIA_DC        e.g. "com"
 *   ZIA_ORG_ID    Zia Agents org id that owns the agent (Rezoho1 = 893309102)
 *   ZIA_AGENT_ID  Deployed agent id (9917000000286009)
 */

const CONNECTION_LINK_NAME = 'agents';

const AGENTS_HOST = {
  com: 'agents.zoho.com',
  in: 'agents.zoho.in',
  eu: 'agents.zoho.eu',
  au: 'agents.zoho.com.au',
  ca: 'agents.zohocloud.ca',
  jp: 'agents.zoho.jp',
  sa: 'agents.zoho.sa',
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function config() {
  const dc = process.env.ZIA_DC || 'com';
  return {
    orgId: requireEnv('ZIA_ORG_ID'),
    agentId: requireEnv('ZIA_AGENT_ID'),
    agentsHost: AGENTS_HOST[dc] || AGENTS_HOST.com,
  };
}

async function connectionHeaders(catalystApp) {
  const { headers } = await catalystApp.connections().getConnectionCredentials(CONNECTION_LINK_NAME);
  if (!headers || !headers.Authorization) {
    throw new Error('Catalyst Connection "agents" returned no Authorization header — check it is Connected in the console.');
  }
  return headers;
}

async function uploadAttachment(catalystApp, fileBuffer, fileName, mimeType) {
  const cfg = config();
  const authHeaders = await connectionHeaders(catalystApp);

  const form = new FormData();
  form.append('file', new Blob([fileBuffer], { type: mimeType || 'application/octet-stream' }), fileName);
  form.append('fileName', fileName);

  const response = await fetch(`https://${cfg.agentsHost}/ziaagents/api/v1/files`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'X-ZIAAGENTS-ORG': cfg.orgId,
    },
    body: form,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Zia file upload failed: ${response.status} ${JSON.stringify(body)}`);
  }
  const fileId = body?.data?.fileId;
  if (!fileId) throw new Error(`Zia file upload returned no fileId: ${JSON.stringify(body)}`);
  return fileId;
}

async function triggerAgent(catalystApp, query, attachmentIds) {
  const cfg = config();
  const authHeaders = await connectionHeaders(catalystApp);

  const response = await fetch(`https://${cfg.agentsHost}/ziaagents/api/v1/agents/${cfg.agentId}/trigger`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'X-ZIAAGENTS-ORG': cfg.orgId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      reasoning: false,
      systemArgs: {},
      attachments: attachmentIds,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Zia agent trigger failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body?.data || {};
}

/**
 * Full flow: upload the photo as an attachment, then trigger the agent with it.
 * Returns the agent's parsed JSON reply (see the agent's guidelines for the shape).
 */
async function analyzeMealPhoto(catalystApp, fileBuffer, fileName, mimeType) {
  const fileId = await uploadAttachment(catalystApp, fileBuffer, fileName, mimeType);
  const result = await triggerAgent(catalystApp, 'Analyze this meal photo.', [fileId]);

  if (result.status && result.status !== 'success') {
    throw new Error(`Agent execution status: ${result.status}`);
  }

  const raw = result.response || '';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Agent did not return valid JSON: ${raw.slice(0, 500)}`);
  }
  return parsed;
}

module.exports = { analyzeMealPhoto };
