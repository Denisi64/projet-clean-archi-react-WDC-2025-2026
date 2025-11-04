const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const [client, advisor] = await Promise.all([
        prisma.user.upsert({
            where: { email: 'client@avenir.bank' },
            update: {},
            create: { email: 'client@avenir.bank', name: 'Client Démo', password: 'hashed:demo', role: 'CLIENT' },
        }),
        prisma.user.upsert({
            where: { email: 'advisor@avenir.bank' },
            update: {},
            create: { email: 'advisor@avenir.bank', name: 'Conseiller Démo', password: 'hashed:demo', role: 'ADVISOR' },
        }),
    ]);

    const current = await prisma.account.upsert({
        where: { iban: 'FR7630006000011234567890189' },
        update: {},
        create: { userId: client.id, iban: 'FR7630006000011234567890189', name: 'Compte Courant', type: 'CURRENT', balance: '5000.00' },
    });

    const savings = await prisma.account.upsert({
        where: { iban: 'FR7630006000019999999999999' },
        update: {},
        create: { userId: client.id, iban: 'FR7630006000019999999999999', name: 'Livret Avenir', type: 'SAVINGS', balance: '2500.00' },
    });

    const rate = await prisma.tauxEpargne.upsert({
        where: { id: 'global-rate' },
        update: {},
        create: { id: 'global-rate', rate: '0.0125', active: true },
    });

    const [ava, neo] = await Promise.all([
        prisma.action.upsert({ where: { symbol: 'AVA' }, update: {}, create: { symbol: 'AVA', name: 'Avenir Bank SA' } }),
        prisma.action.upsert({ where: { symbol: 'NEO' }, update: {}, create: { symbol: 'NEO', name: 'NEOWare' } }),
    ]);

    await prisma.portfolio.upsert({
        where: { userId_actionId: { userId: client.id, actionId: ava.id } },
        update: { quantity: '10', avgPrice: '100.00' },
        create: { userId: client.id, actionId: ava.id, quantity: '10', avgPrice: '100.00' },
    });

    await prisma.order.create({
        data: { userId: client.id, actionId: neo.id, side: 'BUY', quantity: '5', limitPrice: '50.00', status: 'OPEN', fee: '1.00' },
    });

    await prisma.$transaction(async (tx) => {
        const amount = '100.00';
        const tr = await tx.transfer.create({
            data: { sourceAccountId: current.id, destAccountId: savings.id, amount, note: 'Alimentation livret' },
        });
        await tx.operation.createMany({
            data: [
                { accountId: current.id, kind: 'DEBIT', amount, transferId: tr.id, metadata: 'Transfert interne vers livret' },
                { accountId: savings.id, kind: 'CREDIT', amount, transferId: tr.id, metadata: 'Transfert interne depuis courant' },
            ],
        });
        await tx.account.update({ where: { id: current.id }, data: { balance: { decrement: amount } } });
        await tx.account.update({ where: { id: savings.id }, data: { balance: { increment: amount } } });
    });

    await prisma.interestAccrual.create({ data: { accountId: savings.id, rateId: rate.id, amount: '0.86' } });

    console.log('✅ Seed OK');
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
});
