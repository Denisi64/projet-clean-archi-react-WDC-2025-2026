type Locale = "fr" | "en";

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
    fr: {
        welcome: "Bienvenue sur Avenir Bank — backend : {backend} | base : {db}",
        title: "Mes comptes bancaires",
        subtitle: "Chaque utilisateur reçoit un compte courant dès l'inscription. Cette section affiche IBAN, solde et statut.",
        helloUser: "Bonjour {name} ({role})",
        notAuth: "Connectez-vous pour récupérer vos comptes. Après confirmation d'email, rechargez la page.",
        noAccounts: "Aucun compte trouvé pour ce profil. Créez un nouvel utilisateur puis reconnectez-vous.",
        addAccount: "Ajouter un compte",
        transfer: "Effectuer un transfert",
        transferInfo: "Transferts internes uniquement (IBAN d'un compte Avenir Bank). Le solde s'actualise automatiquement.",
        createAccount: "Créer un compte",
        login: "Se connecter",
        transfers: "Historique des transferts",
        logout: "Se déconnecter",
    },
    en: {
        welcome: "Welcome to Avenir Bank — backend: {backend} | database: {db}",
        title: "My bank accounts",
        subtitle: "Each user gets a current account at signup. This section shows IBAN, balance and status.",
        helloUser: "Hello {name} ({role})",
        notAuth: "Sign in to fetch your accounts. After email confirmation, reload the page.",
        noAccounts: "No account found for this profile. Create a new user then sign in again.",
        addAccount: "Add an account",
        transfer: "Make a transfer",
        transferInfo: "Internal transfers only (Avenir Bank IBAN). Balance updates automatically.",
        createAccount: "Create an account",
        login: "Sign in",
        transfers: "Transfers history",
        logout: "Sign out",
    },
};

export function getLocale(searchLang?: string): Locale {
    if (searchLang === "en" || searchLang === "fr") return searchLang;
    const fallback = "fr";
    return fallback;
}

export function t(locale: Locale, key: keyof Dict, params?: Record<string, string>) {
    const dict = dictionaries[locale] ?? dictionaries.fr;
    const template = dict[key] ?? key;
    if (!params) return template;
    return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), template);
}
