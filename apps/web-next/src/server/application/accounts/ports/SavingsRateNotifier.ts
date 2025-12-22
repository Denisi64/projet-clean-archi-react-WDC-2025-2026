export interface SavingsRateNotifier {
    notifyRateChanged(rate: number): Promise<void>;
}
