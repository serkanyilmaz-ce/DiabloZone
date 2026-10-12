import assert from 'node:assert/strict';
import test from 'node:test';
import { clientAddress } from '../src/lib/client-address';

test('only the explicitly trusted loopback proxy can supply a client address', () => {
  assert.equal(clientAddress('127.0.0.1','198.51.100.8',true),'198.51.100.8');
  assert.equal(clientAddress('::1','2001:db8::1',true),'2001:db8::1');
  assert.equal(clientAddress('127.0.0.1','198.51.100.8',false),'127.0.0.1');
  assert.equal(clientAddress('203.0.113.9','198.51.100.8',true),'203.0.113.9');
  assert.equal(clientAddress('127.0.0.1','198.51.100.8, 198.51.100.9',true),'127.0.0.1');
  assert.equal(clientAddress('127.0.0.1',['198.51.100.8'],true),'127.0.0.1');
  assert.equal(clientAddress(undefined,undefined,true),'unknown');
  assert.equal(clientAddress('172.30.42.10','198.51.100.8',false,'172.30.42.10'),'198.51.100.8');
  assert.equal(clientAddress('172.30.42.11','198.51.100.8',false,'172.30.42.10'),'172.30.42.11');
  assert.equal(clientAddress('127.0.0.1','198.51.100.8',false,'172.30.42.10'),'127.0.0.1');
});
