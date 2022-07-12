import { config } from 'dotenv';
config();

export const DEAD_BY_CAPTCHA_USER = process.env.DEAD_BY_CAPTCHA_USER || '';
export const DEAD_BY_CAPTCHA_PASSWORD = process.env.DEAD_BY_CAPTCHA_PASSWORD || '';
export const EXECUTABLE_PATH = process.env.EXECUTABLE_PATH || '';
