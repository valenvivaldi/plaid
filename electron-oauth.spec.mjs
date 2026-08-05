import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {afterEach, describe, expect, it, vi} from "vitest";
import oauthModule from "./electron-oauth.js";
import bridgeModule from "./electron-main-bridge.js";

const {createOauthService} = oauthModule;
const {validateExternalUrl} = bridgeModule;
const temporaryDirectories = [];

function createService(fetch) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "plaid-oauth-test-"));
  temporaryDirectories.push(directory);
  const configuration = Buffer.from(JSON.stringify({clientId: "client", clientSecret: "secret"}));
  fs.writeFileSync(path.join(directory, "atlassian-oauth-config.bin"), configuration.toString("base64"));
  const persistAuthInfo = vi.fn();
  const service = createOauthService({
    app: {getPath: () => directory},
    net: {fetch},
    safeStorage: {
      isEncryptionAvailable: () => true,
      decryptString: value => value.toString(),
      encryptString: value => Buffer.from(value)
    },
    shell: {openExternal: vi.fn()},
    persistAuthInfo
  });
  return {persistAuthInfo, service};
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

describe("OAuth token refresh", () => {
  it("shares one refresh request between concurrent callers", async () => {
    let releaseFetch;
    const fetch = vi.fn(() => new Promise(resolve => { releaseFetch = resolve; }));
    const {persistAuthInfo, service} = createService(fetch);
    const saved = {
      accessToken: "expired", refreshToken: "refresh-token", expiresAt: 0,
      jiraUrl: "https://example.atlassian.net", cloudId: "cloud"
    };

    const first = service.accessToken(saved);
    const second = service.accessToken(saved);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    releaseFetch({
      ok: true, status: 200,
      text: async () => JSON.stringify({access_token: "fresh", refresh_token: "rotated", expires_in: 3600})
    });

    await expect(Promise.all([first, second])).resolves.toEqual(["fresh", "fresh"]);
    expect(persistAuthInfo).toHaveBeenCalledOnce();
    expect(persistAuthInfo).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: "fresh", refreshToken: "rotated"
    }));
  });

  it("maps an invalid refresh grant to an expired session", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false, status: 400,
      text: async () => JSON.stringify({error: "invalid_grant"})
    });
    const {service} = createService(fetch);

    await expect(service.accessToken({
      accessToken: "expired", refreshToken: "invalid", expiresAt: 0
    })).rejects.toMatchObject({
      code: "OAUTH_SESSION_EXPIRED",
      message: "The Atlassian session expired. Log in again."
    });
  });
});

describe("external URL validation", () => {
  it("accepts HTTP(S) URLs and rejects other protocols", () => {
    expect(validateExternalUrl("https://example.atlassian.net/browse/TEST-1"))
      .toBe("https://example.atlassian.net/browse/TEST-1");
    expect(() => validateExternalUrl("file:///tmp/private"))
      .toThrow("Only HTTP(S) external URLs are allowed");
  });
});
