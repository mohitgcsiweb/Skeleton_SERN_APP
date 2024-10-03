import dotenv from 'dotenv';
dotenv.config();

export const mongoURI = process.env.MONGO_URI;
export const jwtSecret = process.env.JWT_SECRET;
export const resetSecret = process.env.RESET_SECRET;
export const emailSGHost = process.env.SENDGRID_HOST;
export const emailSGApiKey = process.env.SENDGRID_API_KEY;
export const emailSGUser = process.env.SENDGRID_USERNAME;
export const emailSGPass = process.env.SENDGRID_PASSWORD;
export const nodeEnv = process.env.NODE_ENV;
export const port = process.env.PORT;
export const url = process.env.URL;
export const sessionTimeout = process.env.SESSION_TIMEOUT;
