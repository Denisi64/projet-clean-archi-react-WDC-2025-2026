import nodemailer from "nodemailer";
import { EmailService } from "../../domain/auth/ports/EmailService";
import { EmailDeliveryError } from "../../domain/auth/errors/EmailDeliveryError";

export class NodemailerEmailService implements EmailService {
    private readonly host = process.env.SMTP_HOST ?? "mailhog";
    private readonly port = Number(process.env.SMTP_PORT ?? "1025");
    private readonly from = process.env.SMTP_FROM ?? "no-reply@example.com";
    private readonly frontUrl = (process.env.FRONT_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    private readonly ttlHours = Number(process.env.CONFIRMATION_TOKEN_TTL_HOURS ?? "24");
    private transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: false,
    });

    async sendConfirmationEmail(email: string, token: string): Promise<void> {
        const link = `${this.frontUrl}/auth/confirm?token=${encodeURIComponent(token)}`;
        const ttl = Number.isFinite(this.ttlHours) ? this.ttlHours : 24;

        try {
            await this.transporter.sendMail({
                from: this.from,
                to: email,
                subject: "Confirmez votre compte",
                text: [
                    "Bonjour,",
                    "",
                    "Merci pour votre inscription. Pour activer votre compte, cliquez sur le lien ci-dessous :",
                    link,
                    "",
                    `Ce lien expire dans ${ttl}h.`,
                    "",
                    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
                ].join("\n"),
                html: [
                    "<p>Bonjour,</p>",
                    "<p>Merci pour votre inscription. Pour activer votre compte, cliquez sur le lien ci-dessous :</p>",
                    `<p><a href="${link}">${link}</a></p>`,
                    `<p>Ce lien expire dans ${ttl}h.</p>`,
                    "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>",
                ].join(""),
            });
        } catch (err: any) {
            const reason = err?.message ?? "smtp send failed";
            const shouldRetryLocal =
                this.host === "mailhog" &&
                /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|connect ECONNREFUSED/i.test(reason);

            if (shouldRetryLocal) {
                try {
                    this.transporter = nodemailer.createTransport({
                        host: "127.0.0.1",
                        port: this.port,
                        secure: false,
                    });
                    await this.transporter.sendMail({
                        from: this.from,
                        to: email,
                        subject: "Confirmez votre compte",
                        text: [
                            "Bonjour,",
                            "",
                            "Merci pour votre inscription. Pour activer votre compte, cliquez sur le lien ci-dessous :",
                            link,
                            "",
                            `Ce lien expire dans ${ttl}h.`,
                            "",
                            "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
                        ].join("\n"),
                        html: [
                            "<p>Bonjour,</p>",
                            "<p>Merci pour votre inscription. Pour activer votre compte, cliquez sur le lien ci-dessous :</p>",
                            `<p><a href="${link}">${link}</a></p>`,
                            `<p>Ce lien expire dans ${ttl}h.</p>`,
                            "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>",
                        ].join(""),
                    });
                    return;
                } catch (retryErr: any) {
                    const retryReason = retryErr?.message ?? reason;
                    console.error("[Mail] retry on localhost failed:", retryReason);
                    throw new EmailDeliveryError(retryReason);
                }
            }

            console.error("[Mail] sendConfirmationEmail failed:", reason);
            throw new EmailDeliveryError(reason);
        }
    }
}
