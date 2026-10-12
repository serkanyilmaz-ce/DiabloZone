import { isIP } from 'node:net';

// The selected Nginx configuration overwrites X-Real-IP. Trust is opt-in and
// only applies to a proxy connected over loopback; never trust arbitrary peers.
export function clientAddress(remoteAddress: string | undefined, realIp: string | string[] | undefined, trustLoopback: boolean, trustedProxyAddress?: string): string {
  const remote = remoteAddress ?? 'unknown';
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote);
  const exactProxy=!!trustedProxyAddress && !!isIP(trustedProxyAddress) && (remote===trustedProxyAddress || remote===`::ffff:${trustedProxyAddress}`);
  if (((trustLoopback && loopback) || exactProxy) && typeof realIp === 'string' && isIP(realIp)) return realIp;
  return remote;
}
