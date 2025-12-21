"use client";

import { AccountRow, type Account } from "./AccountRow";

type Props = {
    accounts: Account[];
};

export default function AccountTable({ accounts }: Props) {
    if (accounts.length === 0) return null;

    return (
        <>
            {accounts.map((account) => (
                <AccountRow key={account.id} account={account} />
            ))}
        </>
    );
}
