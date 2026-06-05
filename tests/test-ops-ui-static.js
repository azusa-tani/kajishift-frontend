const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const api = read('js/api.js');
assert(api.includes('resolveOpsOperation'), 'api.js must resolve write operations before requests');
assert(api.includes('ensureOperationAllowed'), 'api.js must preflight stopped operations');
assert(api.includes('kajishiftOpsPausedPanel'), 'api.js must render OPERATION_PAUSED panel');
assert(api.includes('canWriteNotifications'), 'api.js must understand notification write capability');

const payment = read('customer/payment.html');
assert(payment.includes('canCreateSetupIntents'), 'payment.html must block card setup before opening Stripe flow');
assert(payment.includes('canWriteCards'), 'payment.html must block card mutations');

const customerChat = read('customer/chat.html');
const workerChat = read('worker/chat.html');
assert(customerChat.includes('canSendMessages') && customerChat.includes('canUploadFiles'), 'customer chat must block send/upload');
assert(workerChat.includes('canSendMessages') && workerChat.includes('canUploadFiles'), 'worker chat must block send/upload');

const serviceWorker = read('service-worker.js');
assert(serviceWorker.includes('/js/api.js') && serviceWorker.includes('/js/config.js'), 'service worker must avoid stale ops JS/config');

console.log('Frontend ops UI static coverage passed');
