const crypto = require('crypto');

/**
 * Gets a 16-byte Buffer key from the environment variable ICICI_KEY.
 * Truncates or zero-pads the key to fit exactly 16 bytes for AES-128 if needed.
 */
function getKeyBuffer() {
  const key = process.env.ICICI_KEY || 'db06cca0-838b-4e01-8b20-6ac446ffb6bd';
  let keyBuffer = Buffer.from(key, 'utf8');
  if (keyBuffer.length > 16) {
    keyBuffer = keyBuffer.subarray(0, 16);
  } else if (keyBuffer.length < 16) {
    const pad = Buffer.alloc(16);
    keyBuffer.copy(pad);
    keyBuffer = pad;
  }
  return keyBuffer;
}

/**
 * Encrypts cleartext using AES-128-ECB and returns a Base64-encoded string.
 */
function encrypt(text) {
  if (!text) return '';
  const keyBuffer = getKeyBuffer();
  const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer, null);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

/**
 * Decrypts Base64-encoded ciphertext using AES-128-ECB.
 */
function decrypt(ciphertext) {
  if (!ciphertext) return '';
  const keyBuffer = getKeyBuffer();
  const decipher = crypto.createDecipheriv('aes-128-ecb', keyBuffer, null);
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generates the current timestamp in YYYYMMDDHHMMSS format in IST (UTC+5:30).
 */
function getTxnDate() {
  const now = new Date();
  // Offset UTC time to Indian Standard Time (IST)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  const yyyy = istTime.getUTCFullYear();
  const mm = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istTime.getUTCDate()).padStart(2, '0');
  const hh = String(istTime.getUTCHours()).padStart(2, '0');
  const min = String(istTime.getUTCMinutes()).padStart(2, '0');
  const ss = String(istTime.getUTCSeconds()).padStart(2, '0');
  
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

/**
 * Cleans the phone number into a standard 12-digit format starting with 91 (e.g. 919999999999).
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '919999999999';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned.substring(0, 15) || '919999999999';
}

/**
 * Cleans the customer name to keep only alphanumeric characters and space.
 */
function cleanName(name) {
  if (!name) return 'Customer';
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  return cleaned.substring(0, 50) || 'Customer';
}

/**
 * Calculates HMAC-SHA256 secure hash for pgpay payload.
 * Collects all parameters, sorts keys alphabetically, concatenates values without delimiters,
 * and signs it using the Merchant Secret Key (hex digest).
 */
function calculateSecureHash(payload, secretKey) {
  // 1. Sort keys alphabetically (excluding secureHash itself)
  const sortedKeys = Object.keys(payload)
    .filter(key => key !== 'secureHash')
    .sort();
    
  // 2. Concatenate values without delimiters
  let dataString = '';
  for (const key of sortedKeys) {
    const val = payload[key];
    if (val !== null && val !== undefined) {
      dataString += val;
    }
  }
  
  console.log('[RADICAL] Concat Plain HashText:', dataString);

  // 3. Generate HMAC-SHA256
  return crypto
    .createHmac('sha256', secretKey)
    .update(dataString)
    .digest('hex');
}

/**
 * Generates the redirect URL for the ICICI Bank pgpay Payment Gateway.
 * Sends a server-to-server POST request to initiateSale API and returns the redirection URL.
 * 
 * @param {string} orderId - Unique order identifier
 * @param {number} amount - Total amount of the order (e.g. 999.00)
 * @param {string} host - The HTTP host of the request (to dynamically generate returnURL)
 * @param {string} customerEmail - Customer email address
 * @param {string} rawCustomerName - Customer name
 * @param {string} rawCustomerPhone - Customer mobile number
 */
async function generatePaymentURL(orderId, amount, host, customerEmail, rawCustomerName, rawCustomerPhone) {
  const mid = process.env.ICICI_MID || '100000000007164';
  const secretKey = process.env.ICICI_KEY || 'db06cca0-838b-4e01-8b20-6ac446ffb6bd';
  const aggId = process.env.ICICI_AGG_ID || 'A100000000007164';
  
  const saleApiUrl = process.env.ICICI_SALE_API || 'https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale';

  // Dynamic Return URL configuration
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const returnUrl = `${protocol}://${host}/api/orders/payment/callback`;

  // Format amount to 2 decimal places as required
  const formattedAmount = Number(amount).toFixed(2);

  // Clean customer details
  const customerName = cleanName(rawCustomerName);
  const customerMobileNo = cleanPhoneNumber(rawCustomerPhone);

  // Prepare initiateSale payload (all 14 parameters specified in integration sheet)
  const payload = {
    addlParam1: '000',
    addlParam2: '111',
    aggregatorID: aggId,
    amount: formattedAmount,
    currencyCode: '356', // INR
    customerEmailID: customerEmail || 'guest@jiopay.com',
    customerMobileNo: customerMobileNo,
    customerName: customerName,
    merchantId: mid,
    merchantTxnNo: orderId,
    payType: '0', // Hosted Checkout
    returnURL: returnUrl,
    transactionType: 'SALE',
    txnDate: getTxnDate()
  };

  // Generate the checksum hash
  payload.secureHash = calculateSecureHash(payload, secretKey);

  console.log('[RADICAL] Sending pgpay initiateSale payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(saleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gateway returned HTTP status: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[RADICAL] pgpay initiateSale response:', JSON.stringify(result, null, 2));

    if (result.responseCode === 'R1000') {
      if (result.redirectURI && result.tranCtx) {
        return `${result.redirectURI}?tranCtx=${result.tranCtx}`;
      } else if (result.redirectURI) {
        return result.redirectURI;
      } else {
        throw new Error('No redirectURI or tranCtx returned in response.');
      }
    } else {
      throw new Error(`Gateway response: ${result.responseMessage || result.responseDescription || result.responseCode}`);
    }
  } catch (err) {
    console.error('[RADICAL] Error calling initiateSale:', err);
    throw err;
  }
}

module.exports = {
  encrypt,
  decrypt,
  generatePaymentURL
};
