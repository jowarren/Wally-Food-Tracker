import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const RECIPIENTS = {
  person1: {
    name: process.env.RECIPIENT_1_NAME ?? "Recipient 1",
    email: process.env.RECIPIENT_1_EMAIL ?? "",
    smsGateway: process.env.RECIPIENT_1_SMS ?? "",
  },
  person2: {
    name: process.env.RECIPIENT_2_NAME ?? "Recipient 2",
    email: process.env.RECIPIENT_2_EMAIL ?? "",
    smsGateway: process.env.RECIPIENT_2_SMS ?? "",
  },
};
