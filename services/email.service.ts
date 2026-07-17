import nodemailer from "nodemailer";
import { getEnv, isEmailConfigured } from "@/lib/env";
import { logger } from "@/utils/logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isEmailConfigured()) {
    logger.warn("Email not configured — skipping notification");
    return null;
  }

  if (!transporter) {
    const env = getEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

interface OfflineEmailParams {
  to: string;
  deviceName: string;
  ip: string;
  timestamp: Date;
  lastSuccessfulPing: Date | null;
}

interface RecoveryEmailParams {
  to: string;
  deviceName: string;
  ip: string;
  latency: number;
  recoveryTime: Date;
}

export async function sendOfflineAlert(
  params: OfflineEmailParams
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  const { SMTP_FROM } = getEnv();
  const lastPingStr = params.lastSuccessfulPing
    ? params.lastSuccessfulPing.toLocaleString()
    : "Never";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">🚨 Device Offline</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Device Name</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.deviceName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>IP Address</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.ip}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Timestamp</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.timestamp.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px;"><strong>Last Successful Ping</strong></td><td style="padding: 8px;">${lastPingStr}</td></tr>
      </table>
    </div>
  `;

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to: params.to,
      subject: "🚨 Device Offline",
      html,
      text: `Device Offline\n\nDevice Name: ${params.deviceName}\nIP Address: ${params.ip}\nTimestamp: ${params.timestamp.toLocaleString()}\nLast Successful Ping: ${lastPingStr}`,
    });
    logger.info(`Offline alert sent for ${params.deviceName}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send offline alert for ${params.deviceName}`, error);
    return false;
  }
}

export async function sendRecoveryAlert(
  params: RecoveryEmailParams
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  const { SMTP_FROM } = getEnv();
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">✅ Device Online Again</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Device Name</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.deviceName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>IP Address</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.ip}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Latency</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${Math.round(params.latency)} ms</td></tr>
        <tr><td style="padding: 8px;"><strong>Recovery Time</strong></td><td style="padding: 8px;">${params.recoveryTime.toLocaleString()}</td></tr>
      </table>
    </div>
  `;

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to: params.to,
      subject: "✅ Device Online Again",
      html,
      text: `Device Online Again\n\nDevice Name: ${params.deviceName}\nIP Address: ${params.ip}\nLatency: ${Math.round(params.latency)} ms\nRecovery Time: ${params.recoveryTime.toLocaleString()}`,
    });
    logger.info(`Recovery alert sent for ${params.deviceName}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send recovery alert for ${params.deviceName}`, error);
    return false;
  }
}
