import nodemailer from "nodemailer";
import { getEmailRoutingConfig, getSmtpConfig } from "./env";
import type { FinalSubmissionInput } from "./schema";
import { buildSubmissionEmailText } from "./submit-service";

export async function sendSubmissionEmail(payload: FinalSubmissionInput) {
  const smtp = getSmtpConfig();
  const routing = getEmailRoutingConfig();

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  const textBody = buildSubmissionEmailText(payload);

  return transporter.sendMail({
    from: smtp.fromEmail,
    to: routing.accountantEmail,
    cc: routing.internalCcEmails,
    subject: `New onboarding packet: ${payload.profile.fullLegalName}`,
    text: textBody,
  });
}
