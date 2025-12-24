export default function BannedPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
            <div className="max-w-xl rounded-lg border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold">Compte suspendu</h1>
                <p className="mt-4 text-muted-foreground">
                    Votre compte a été banni par un directeur. Vous n’avez plus accès aux services
                    de la plateforme.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Si vous pensez qu’il s’agit d’une erreur, contactez un conseiller.
                </p>
            </div>
        </main>
    );
}
