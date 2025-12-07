export interface InterestRateProvider {
    /**
     * Retourne le taux annuel (ex: 0.02 pour 2%/an).
     */
    getAnnualRate(): Promise<number>;
}
