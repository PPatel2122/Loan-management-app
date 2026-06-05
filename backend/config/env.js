const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = fs.existsSync('/etc/secrets/.env')
  ? '/etc/secrets/.env'
  : fs.existsSync(path.join(__dirname, '..', '..', '.env'))
    ? path.join(__dirname, '..', '..', '.env')
    : path.join(__dirname, '..', '.env');

dotenv.config({ path: envPath });
