import prisma from "../dataBase/prisma";
import { resend, EMAIL_FROM } from "./resend.client";
import { buildWelcomeEmail, WelcomeEmailData } from "./templates/welcome.template";
import { buildRentalConfirmEmail } from "./templates/rental-confirm.template";
import { buildRentalReturnEmail } from "./templates/rental-return.template";
import { buildPaymentReceiptEmail } from "./templates/payment-receipt.template";
import { buildPasswordResetEmail } from "./templates/password-reset.template";
import { buildVerifyEmail } from "./templates/verify-email.template";

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const { subject, html } = buildWelcomeEmail(data);
  await resend.emails.send({ from: EMAIL_FROM, to: data.adminEmail, subject, html });
}

export async function sendEmailVerificationEmail(data: {
  userName: string;
  userEmail: string;
  verifyToken: string;
  tenantName: string;
  tenantSlug: string;
}): Promise<void> {
  const { subject, html } = buildVerifyEmail(data);
  await resend.emails.send({ from: EMAIL_FROM, to: data.userEmail, subject, html });
}

export async function sendPasswordResetEmail(data: {
  userName: string;
  userEmail: string;
  resetToken: string;
}): Promise<void> {
  const { subject, html } = buildPasswordResetEmail(data);
  await resend.emails.send({ from: EMAIL_FROM, to: data.userEmail, subject, html });
}

export async function sendRentalConfirmEmail(rentalId: string): Promise<void> {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { client: true, vehicle: true, user: true, tenant: true },
  });

  if (!rental || !rental.tenant.emailNotifications || !rental.client.email) return;

  const { subject, html } = buildRentalConfirmEmail(rental);

  await resend.emails.send({ from: EMAIL_FROM, to: rental.client.email, subject, html });
}

export async function sendRentalReturnEmail(rentalId: string): Promise<void> {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { client: true, vehicle: true, user: true, tenant: true, payments: true },
  });

  if (!rental || !rental.tenant.emailNotifications || !rental.client.email) return;

  const { subject, html } = buildRentalReturnEmail(rental);

  await resend.emails.send({ from: EMAIL_FROM, to: rental.client.email, subject, html });
}

export async function sendPaymentReceiptEmail(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { rental: { include: { client: true, vehicle: true, tenant: true } } },
  });

  if (!payment || !payment.rental.tenant.emailNotifications || !payment.rental.client.email) return;

  const { subject, html } = buildPaymentReceiptEmail(payment);

  await resend.emails.send({ from: EMAIL_FROM, to: payment.rental.client.email, subject, html });
}
