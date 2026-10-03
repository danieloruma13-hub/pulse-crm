const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Termux/Android networks often lack working IPv6 routes

const app = require('./src/app');
const { port } = require('./src/config/env');

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
