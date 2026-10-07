import proxy from 'express-http-proxy';

const DEFAULT_PROXY_TIMEOUT_MS = 120_000;
const AGENT_PROXY_TIMEOUT_MS = 600_000;

export const proxyWithHeader = (serviceUrl, options = {}) => {
    const timeoutMs = options.timeoutMs ?? DEFAULT_PROXY_TIMEOUT_MS;

    return proxy(serviceUrl, {
        timeout: timeoutMs,
        proxyTimeout: timeoutMs,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq.user) {
                proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
            }
            return proxyReqOpts;
        },
    });
};

export const agentProxy = (serviceUrl) =>
    proxyWithHeader(serviceUrl, { timeoutMs: AGENT_PROXY_TIMEOUT_MS });
