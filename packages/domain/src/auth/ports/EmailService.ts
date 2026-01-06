export interface EmailService {
    sendConfirmationEmail(email: string, token: string): Promise<void>;
}
