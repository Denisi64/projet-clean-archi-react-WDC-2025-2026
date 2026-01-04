export interface ActivationTokenGenerator {
    generate(): Promise<string>;
}
