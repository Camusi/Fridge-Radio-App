import { API_BASE_URL } from '../../config.local';
import * as Crypto from 'expo-crypto';

export const checkPassword = async (passwordHash: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ passwordHash }),
    });

    return await response.json() === true;
  } catch {
    return false;
  }
};

export const hashPassword = async (password: string) => {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
};