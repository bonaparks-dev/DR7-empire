import crypto from 'crypto';

/**
 * Nexi XPay API Client
 * Documentation: https://developer.nexigroup.com/xpayglobal/en-EU/api/
 */

export interface NexiConfig {
  alias: string;
  macKey: string;
  merchantId: string;
  terminalId: string;
  environment: 'sandbox' | 'production';
  apiKey: string;
}

export interface NexiPaymentRequest {
  amount: number; // Amount in cents (e.g., 10050 for €100.50)
  currency: string; // ISO currency code (e.g., 'EUR')
  description: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  returnUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
}

export interface NexiPaymentResponse {
  codTrans: string; // Transaction code
  esito: string; // Result: OK, KO
  url?: string; // Payment page URL
  idOperazione?: string; // Operation ID
  timestamp?: string;
  mac?: string;
  error?: string;
}

/**
 * Generate MAC (Message Authentication Code) for request security
 */
function generateMAC(params: Record<string, any>, macKey: string): string {
  // Sort parameters alphabetically
  const sortedKeys = Object.keys(params).sort();

  // Build the string to hash: key1=value1key2=value2...
  let macString = '';
  for (const key of sortedKeys) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      macString += `${key}=${params[key]}`;
    }
  }

  // Add MAC key at the end
  macString += macKey;

  // Calculate SHA1 hash
  const hash = crypto.createHash('sha1').update(macString, 'utf8').digest('hex');

  return hash;
}

/**
 * Get Nexi API base URL based on environment
 */
function getBaseUrl(environment: 'sandbox' | 'production'): string {
  return environment === 'sandbox'
    ? 'https://xpaysandboxdb.nexigroup.com'
    : 'https://xpay.nexigroup.com';
}

/**
 * Create a payment request with Nexi XPay
 */
export async function createNexiPayment(
  config: NexiConfig,
  paymentRequest: NexiPaymentRequest
): Promise<NexiPaymentResponse> {
  try {
    const baseUrl = getBaseUrl(config.environment);

    // Prepare request parameters
    const params: Record<string, any> = {
      alias: config.alias,
      importo: paymentRequest.amount.toString(),
      divisa: paymentRequest.currency,
      codTrans: paymentRequest.orderId,
      descrizione: paymentRequest.description,
      mail: paymentRequest.customerEmail || '',
      languageId: 'ITA',
      urlpost: paymentRequest.callbackUrl || '',
      url: paymentRequest.returnUrl || '',
      urlback: paymentRequest.cancelUrl || '',
    };

    // Generate MAC
    const mac = generateMAC(params, config.macKey);
    params.mac = mac;

    // Make API request
    const queryString = new URLSearchParams(params).toString();
    const url = `${baseUrl}/ecomm/ecomm/DispatcherServlet?${queryString}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Nexi API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.text();

    // Parse response (Nexi returns key-value pairs)
    const responseData: Record<string, string> = {};
    result.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      responseData[key] = decodeURIComponent(value);
    });

    return {
      codTrans: responseData.codTrans || '',
      esito: responseData.esito || 'KO',
      url: responseData.url,
      idOperazione: responseData.idOperazione,
      timestamp: responseData.timestamp,
      mac: responseData.mac,
      error: responseData.messaggio,
    };
  } catch (error) {
    console.error('Nexi payment creation error:', error);
    throw error;
  }
}

/**
 * Verify callback MAC to ensure it's from Nexi
 */
export function verifyCallbackMAC(
  params: Record<string, any>,
  receivedMAC: string,
  macKey: string
): boolean {
  const calculatedMAC = generateMAC(params, macKey);
  return calculatedMAC === receivedMAC;
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(
  config: NexiConfig,
  codTrans: string
): Promise<any> {
  try {
    const baseUrl = getBaseUrl(config.environment);

    const params = {
      alias: config.alias,
      codTrans: codTrans,
    };

    const mac = generateMAC(params, config.macKey);

    const queryString = new URLSearchParams({
      ...params,
      mac,
    }).toString();

    const url = `${baseUrl}/ecomm/ecomm/XPayServlet?${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': config.apiKey,
      },
    });

    const result = await response.text();

    // Parse response
    const responseData: Record<string, string> = {};
    result.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      responseData[key] = decodeURIComponent(value);
    });

    return responseData;
  } catch (error) {
    console.error('Nexi status check error:', error);
    throw error;
  }
}
