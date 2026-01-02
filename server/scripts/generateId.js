const os = require('os');
const crypto  = require('crypto')

function getDeterministicMachineId() {
  const nets = os.networkInterfaces();
  const macs = Object.values(nets).flat().filter(Boolean).map(n => n.mac)
    .filter(m => m && m !== '00:00:00:00:00:00').sort();
  const seed = macs.join('|') || os.hostname();
  return crypto.createHash('sha256').update(seed).digest('hex');
}

console.log(getDeterministicMachineId());
