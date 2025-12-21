export interface SavingsRateRepository {
    /**
     * Récupère le taux annuel actif (ex: 0.0125 pour 1.25%).
     */
    getActiveRate(): Promise<number | null>;

    /**
     * Enregistre un nouveau taux annuel actif. L'implémentation peut choisir
     * d'écraser l'actuel ou de conserver l'historique.
     */
    saveRate(rate: number): Promise<void>;
}
