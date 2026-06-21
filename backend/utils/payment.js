const crypto = require('crypto');

/**
 * Gets a 16-byte Buffer key from the environment variable ICICI_KEY.
 * Truncates or zero-pads the key to fit exactly 16 bytes for AES-128.
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
 * Generates the redirect URL for the ICICI Bank Eazypay Payment Gateway.
 * 
 * @param {string} orderId - Unique order identifier
 * @param {number} amount - Total amount of the order (e.g. 999.00)
 * @param {string} host - The HTTP host of the request (to dynamically generate returnurl)
 */
function generatePaymentURL(orderId, amount, host) {
  const mid = process.env.ICICI_MID || '100000000007164';
  const aggId = process.env.ICICI_AGG_ID || 'A100000000007164';
  const env = (process.env.ICICI_ENV || 'uat').toLowerCase();
  
  const baseUrl = env === 'production' 
    ? 'https://eazypay.icicibank.com/EazyPG'
    : 'https://eazypayuat.icicibank.com/EazyPG';

  // Dynamic Return URL configuration
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const returnUrl = `${protocol}://${host}/api/orders/payment/callback`;

  // Format amount to 2 decimal places as required by banks
  const formattedAmount = Number(amount).toFixed(2);

  // Mandatory fields: Reference No | Sub Merchant ID | Amount
  const mandatoryFieldsText = `${orderId}|${aggId}|${formattedAmount}`;
  
  // Optional fields: space separated by pipe if empty
  const optionalFieldsText = ' ';

  const encryptedMandatory = encrypt(mandatoryFieldsText);
  const encryptedOptional = encrypt(optionalFieldsText);
  const encryptedReturnUrl = encrypt(returnUrl);
  const encryptedReferenceNo = encrypt(orderId);
  const encryptedSubMerchantId = encrypt(aggId);
  const encryptedAmount = encrypt(formattedAmount);
  const encryptedPaymode = encrypt('9'); // 9 = All modes

  // Construct URL with query parameters.
  // Note: Parameter names MUST match Eazypay exactly (some contain spaces, so they are URL-encoded).
  const params = new URLSearchParams();
  params.append('merchantid', mid);
  params.append('mandatory fields', encryptedMandatory);
  params.append('optional fields', encryptedOptional);
  params.append('returnurl', encryptedReturnUrl);
  params.append('Reference No', encryptedReferenceNo);
  params.append('submerchantid', encryptedSubMerchantId);
  params.append('transaction amount', encryptedAmount);
  params.append('paymode', encryptedPaymode);

  return `${baseUrl}?${params.toString()}`;
}

module.exports = {
  encrypt,
  decrypt,
  generatePaymentURL
};
