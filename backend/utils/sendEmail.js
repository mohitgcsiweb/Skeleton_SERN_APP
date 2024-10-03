import { createTransport } from "nodemailer";
import { emailSGHost, emailSGApiKey } from "../config.js";

const transporter = createTransport({
  host: emailSGHost,
  port: 587,
  auth: {
    user: "apikey",
    pass: emailSGApiKey,
  },
});

const sendEmail = async (to, from, subject, html) => {
  await transporter.sendMail({ to, from, subject, html });
};

export default sendEmail;
