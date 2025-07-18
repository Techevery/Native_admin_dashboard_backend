import axios, { AxiosResponse } from 'axios';
import {Request, Response} from "express";

// Interface for the SMS payload
interface SMSPayload {
  id: string;
  to: string[];
  sender_mask: string;
  priority: 'high' | 'normal' | 'low';
  body: string;
  unicode: '0' | '1';
}

// Interface for the API response (adjust based on actual API response structure)
interface SMSResponse {
  messageId?: string;
  status?: string;
  error?: string;
}

// Configuration for the SMS gateway
const SMS_GATEWAY_CONFIG = {
  BASE_URL: 'https://konnect.dotgo.com/api/v1/Accounts/xqvaJ9KijXKnY62dPN3VCA==/Messages',
  TIMEOUT: 10000, // 10 seconds timeout
};

/**
 * Helper function to send SMS via Konnect gateway
 * @param payload SMS payload containing message details
 * @param apiKey API key for authentication (if required)
 * @returns Promise with the SMS response
 * @throws Error if the request fails
 */
async function sendSMS(payload: SMSPayload, apiKey?: string): Promise<SMSResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      "Authorization": "3EBB6JtGEJ4Xs_PbntwPZTuIfWyKtwWjmUak+Tbh0aM="
    };

    // Add Authorization header if apiKey is provided
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response: AxiosResponse<SMSResponse> = await axios.post(
      SMS_GATEWAY_CONFIG.BASE_URL,
      payload,
      {
        headers,
        timeout: SMS_GATEWAY_CONFIG.TIMEOUT,
      }
    );

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to send SMS: ${error.response?.data?.error || error.message}`
      );
    }
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

async function sendOrderConfirmationSMS(req: Request, res: Response) {
  const payload: SMSPayload = {
    id: '435677888',
    to: ['2349124937833'],
    sender_mask: 'NativeDplus',
    priority: 'high',
    body: 'Hello your order with the below Items has been successfully placed, a rider will get in touch with you shortly',
    unicode: '0',
  };

  try {
    const result = await sendSMS(payload); // Add apiKey if required
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export const sendSMSOrder = async (phone:string) => {
  const payload: SMSPayload = {
    id: '435677888',
    to: [`234${phone}`],
    sender_mask: 'NativeDplus',
    priority: 'high',
    body: 'Hello your order has been successfully placed, a rider will get in touch with you shortly',
    unicode: '0',
  };
    
  try {
    // const result = await sendSMS(payload); // Add apiKey if required
    const headers = {
        "Content-type": "application/json",
        "Authorization": "3EBB6JtGEJ4Xs_PbntwPZTuIfWyKtwWjmUak+Tbh0aM="
    }
   const result = axios.post("https://konnect.dotgo.com/api/v1/Accounts/xqvaJ9KijXKnY62dPN3VCA==/Messages", payload, {headers})
    console.log(`SMS notification sent to ${phone}`);
    return result;
  } catch (error: any) {
    console.log(error);
    return error;
  }
}

export { sendSMS, SMSPayload, SMSResponse };