const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 43817;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth/callback`;
const SCOPES = 'read:jira-work write:jira-work read:jira-user offline_access';

function createOauthService({app, net, safeStorage, shell, persistAuthInfo}) {
  let configuration;
  const configPath = () => path.join(app.getPath('userData'), 'atlassian-oauth-config.bin');

  function loadConfiguration() {
    if (configuration) return configuration;
    if (!safeStorage.isEncryptionAvailable()) return null;
    try {
      const encrypted = Buffer.from(fs.readFileSync(configPath(), 'utf8'), 'base64');
      configuration = JSON.parse(safeStorage.decryptString(encrypted));
      return configuration;
    } catch {
      return null;
    }
  }

  function saveConfiguration(value) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure credential storage is unavailable on this system');
    }
    configuration = value;
    const encrypted = safeStorage.encryptString(JSON.stringify(value));
    fs.writeFileSync(configPath(), encrypted.toString('base64'), {encoding: 'utf8', mode: 0o600});
  }

  function configurationProfile() {
    const saved = loadConfiguration();
    return {
      configured: Boolean(saved?.clientId && saved?.clientSecret),
      clientId: saved?.clientId || '',
      redirectUri: REDIRECT_URI
    };
  }

  async function jsonResponse(response, action) {
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!response.ok) {
      const detail = typeof body === 'object' && body
        ? body.error_description || body.message || body.error : body;
      throw new Error(`${action} failed (${response.status})${detail ? `: ${detail}` : ''}`);
    }
    return body;
  }

  async function requestToken(config, values) {
    const response = await net.fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        ...values
      })
    });
    return jsonResponse(response, 'Atlassian token exchange');
  }

  function waitForCallback(expectedState) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer;
      const server = http.createServer((request, response) => {
        const callback = new URL(request.url, REDIRECT_URI);
        if (callback.pathname !== '/oauth/callback') {
          response.writeHead(404).end();
          return;
        }
        const error = callback.searchParams.get('error');
        const state = callback.searchParams.get('state');
        const code = callback.searchParams.get('code');
        if (error) {
          response.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
          response.end('<h1>Login cancelled</h1><p>You can return to Etendo Plaid.</p>');
          finish(new Error(`Atlassian login was cancelled: ${error}`));
        } else if (state !== expectedState || !code) {
          response.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
          response.end('<h1>Invalid callback</h1><p>You can return to Etendo Plaid.</p>');
          finish(new Error('Atlassian returned an invalid OAuth callback'));
        } else {
          response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
          response.end('<h1>Login complete</h1><p>You can close this tab and return to Etendo Plaid.</p>');
          finish(null, code);
        }
      });
      const finish = (error, code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        server.close();
        error ? reject(error) : resolve(code);
      };
      server.on('error', finish);
      server.listen(PORT, '127.0.0.1');
      timer = setTimeout(() => finish(new Error('Atlassian login timed out')), 180000);
    });
  }

  function normalizeJiraUrl(rawUrl) {
    const parsed = new URL(rawUrl);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP(S) Jira URLs are allowed');
    }
    return parsed.origin;
  }

  function selectResource(resources, preferredJiraUrl) {
    const sites = resources.filter(resource => resource?.id && resource?.url);
    if (!sites.length) throw new Error('This Atlassian account did not grant access to any Jira site');
    if (preferredJiraUrl) {
      const preferred = normalizeJiraUrl(preferredJiraUrl);
      const match = sites.find(site => normalizeJiraUrl(site.url) === preferred);
      if (match) return match;
      throw new Error(`No access to ${preferred}. Available sites: ${sites.map(site => site.url).join(', ')}`);
    }
    if (sites.length === 1) return sites[0];
    throw new Error(`Enter the Jira URL to select a site: ${sites.map(site => site.url).join(', ')}`);
  }

  async function login(options) {
    const existing = loadConfiguration();
    const clientId = String(options?.clientId || existing?.clientId || '').trim();
    const clientSecret = String(options?.clientSecret || existing?.clientSecret || '').trim();
    if (!clientId || !clientSecret) throw new Error('Enter the OAuth client ID and client secret first');
    const config = {clientId, clientSecret};
    saveConfiguration(config);

    const state = crypto.randomBytes(32).toString('hex');
    const callback = waitForCallback(state);
    const authorizeUrl = new URL('https://auth.atlassian.com/authorize');
    authorizeUrl.search = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      state,
      response_type: 'code',
      prompt: 'consent'
    }).toString();
    await shell.openExternal(authorizeUrl.href);
    const code = await callback;
    const tokens = await requestToken(config, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    });

    const response = await net.fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {Accept: 'application/json', Authorization: `Bearer ${tokens.access_token}`}
    });
    const resources = await jsonResponse(response, 'Loading Jira sites');
    const site = selectResource(Array.isArray(resources) ? resources : [], options?.jiraUrl);
    const saved = {
      method: 'oauth',
      jiraUrl: normalizeJiraUrl(site.url),
      username: '',
      cloudId: site.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + Number(tokens.expires_in || 3600) * 1000
    };
    persistAuthInfo(saved);
    return {jiraUrl: saved.jiraUrl, username: '', password: '', method: 'oauth'};
  }

  async function accessToken(saved) {
    if (saved.expiresAt > Date.now() + 60000) return saved.accessToken;
    if (!saved.refreshToken) throw new Error('The Atlassian session expired. Log in again.');
    const config = loadConfiguration();
    if (!config) throw new Error('The OAuth configuration is missing. Log in again.');
    const tokens = await requestToken(config, {
      grant_type: 'refresh_token',
      refresh_token: saved.refreshToken
    });
    const refreshed = {
      ...saved,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || saved.refreshToken,
      expiresAt: Date.now() + Number(tokens.expires_in || 3600) * 1000
    };
    persistAuthInfo(refreshed);
    return refreshed.accessToken;
  }

  return {accessToken, configurationProfile, login};
}

module.exports = {createOauthService};
