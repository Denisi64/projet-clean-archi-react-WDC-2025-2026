"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { useTranslations } from "next-intl";

export default function AdminPanelClient() {
    const t = useTranslations("adminPanel");
    const [banUserId, setBanUserId] = useState("");
    const [banResult, setBanResult] = useState<string | null>(null);
    const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [createUserId, setCreateUserId] = useState("");
    const [createName, setCreateName] = useState("");
    const [createType, setCreateType] = useState<"CURRENT" | "SAVINGS">("CURRENT");
    const [createResult, setCreateResult] = useState<string | null>(null);

    const [renameUserId, setRenameUserId] = useState("");
    const [renameAccounts, setRenameAccounts] = useState<{ id: string; label: string }[]>([]);
    const [renameAccountId, setRenameAccountId] = useState("");
    const [loadingRenameAccounts, setLoadingRenameAccounts] = useState(false);
    const [renameName, setRenameName] = useState("");
    const [renameResult, setRenameResult] = useState<string | null>(null);

    const [closeUserId, setCloseUserId] = useState("");
    const [closeAccounts, setCloseAccounts] = useState<{ id: string; label: string }[]>([]);
    const [closeAccountId, setCloseAccountId] = useState("");
    const [loadingCloseAccounts, setLoadingCloseAccounts] = useState(false);
    const [closeResult, setCloseResult] = useState<string | null>(null);

    async function loadUsers() {
        setLoadingUsers(true);
        try {
            const res = await fetch("/api/admin/users?query=");
            if (!res.ok) {
                setUsers([]);
                return;
            }
            const data = await res.json();
            const list = (data.users ?? []).map((u: any) => ({
                id: u.id,
                label: `${u.name} <${u.email}>`,
            }));
            setUsers(list);
            if (list.length > 0) {
                if (!banUserId) setBanUserId(list[0].id);
                if (!createUserId) setCreateUserId(list[0].id);
                if (!renameUserId) setRenameUserId(list[0].id);
                if (!closeUserId) setCloseUserId(list[0].id);
            }
        } finally {
            setLoadingUsers(false);
        }
    }

    async function loadAccounts(userId: string): Promise<{ id: string; label: string }[]> {
        if (!userId) return [];
        const res = await fetch(`/api/admin/accounts?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.accounts ?? []).map((a: any) => ({
            id: a.id,
            label: `${a.name} (${a.iban})`,
        }));
    }

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        let active = true;
        setLoadingRenameAccounts(true);
        loadAccounts(renameUserId)
            .then((list) => {
                if (!active) return;
                setRenameAccounts(list);
                if (!renameAccountId && list.length > 0) {
                    setRenameAccountId(list[0].id);
                }
            })
            .finally(() => {
                if (active) setLoadingRenameAccounts(false);
            });
        return () => {
            active = false;
        };
    }, [renameUserId]);

    useEffect(() => {
        let active = true;
        setLoadingCloseAccounts(true);
        loadAccounts(closeUserId)
            .then((list) => {
                if (!active) return;
                setCloseAccounts(list);
                if (!closeAccountId && list.length > 0) {
                    setCloseAccountId(list[0].id);
                }
            })
            .finally(() => {
                if (active) setLoadingCloseAccounts(false);
            });
        return () => {
            active = false;
        };
    }, [closeUserId]);

    async function handleBanUser() {
        setBanResult(null);
        if (!banUserId.trim()) {
            setBanResult(t("userIdRequired"));
            return;
        }
        const res = await fetch(`/api/admin/users/${encodeURIComponent(banUserId)}/ban`, {
            method: "POST",
        }).catch(() => null);
        if (!res) {
            setBanResult(t("networkError"));
            return;
        }
        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            setBanResult(payload?.code ?? t("serverError"));
            return;
        }
        setBanResult(t("userBanned"));
    }

    async function handleCreateAccount() {
        setCreateResult(null);
        if (!createUserId.trim()) {
            setCreateResult(t("userIdRequired"));
            return;
        }
        const res = await fetch("/api/admin/accounts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                userId: createUserId.trim(),
                name: createName.trim() || undefined,
                type: createType,
            }),
        }).catch(() => null);
        if (!res) {
            setCreateResult(t("networkError"));
            return;
        }
        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            setCreateResult(payload?.code ?? t("serverError"));
            return;
        }
        setCreateResult(t("accountCreated"));
    }

    async function handleRenameAccount() {
        setRenameResult(null);
        if (!renameAccountId.trim() || !renameUserId.trim() || !renameName.trim()) {
            setRenameResult(t("renameRequired"));
            return;
        }
        const res = await fetch(`/api/admin/accounts/${encodeURIComponent(renameAccountId)}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                userId: renameUserId.trim(),
                name: renameName.trim(),
            }),
        }).catch(() => null);
        if (!res) {
            setRenameResult(t("networkError"));
            return;
        }
        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            setRenameResult(payload?.code ?? t("serverError"));
            return;
        }
        setRenameResult(t("accountRenamed"));
    }

    async function handleCloseAccount() {
        setCloseResult(null);
        if (!closeAccountId.trim() || !closeUserId.trim()) {
            setCloseResult(t("closeRequired"));
            return;
        }
        const res = await fetch(`/api/admin/accounts/${encodeURIComponent(closeAccountId)}/close`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                userId: closeUserId.trim(),
            }),
        }).catch(() => null);
        if (!res) {
            setCloseResult(t("networkError"));
            return;
        }
        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            setCloseResult(payload?.code ?? t("serverError"));
            return;
        }
        setCloseResult(t("accountClosed"));
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t("banTitle")}</CardTitle>
                    <CardDescription>{t("banDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="banUserId">{t("userLabel")}</Label>
                        <Select
                            id="banUserId"
                            value={banUserId}
                            onChange={(e) => setBanUserId(e.target.value)}
                            disabled={loadingUsers || users.length === 0}
                        >
                            {users.length === 0 && <option value="">{t("noUsers")}</option>}
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    {banResult && <p className="text-sm text-muted-foreground">{banResult}</p>}
                    <div className="flex gap-2">
                        <Button onClick={loadUsers} className="w-full" variant="outline">
                            {loadingUsers ? t("loadingUsers") : t("refresh")}
                        </Button>
                        <Button onClick={handleBanUser} className="w-full">
                            {t("ban")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("createTitle")}</CardTitle>
                    <CardDescription>{t("createDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="createUserId">{t("userLabel")}</Label>
                        <Select
                            id="createUserId"
                            value={createUserId}
                            onChange={(e) => setCreateUserId(e.target.value)}
                            disabled={loadingUsers || users.length === 0}
                        >
                            {users.length === 0 && <option value="">{t("noUsers")}</option>}
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="createName">{t("accountNameLabel")}</Label>
                        <Input
                            id="createName"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="createType">{t("accountTypeLabel")}</Label>
                        <Select
                            id="createType"
                            value={createType}
                            onChange={(e) => setCreateType(e.target.value as "CURRENT" | "SAVINGS")}
                        >
                            <option value="CURRENT">{t("typeCurrent")}</option>
                            <option value="SAVINGS">{t("typeSavings")}</option>
                        </Select>
                    </div>
                    {createResult && <p className="text-sm text-muted-foreground">{createResult}</p>}
                    <Button onClick={handleCreateAccount} className="w-full">
                        {t("create")}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("renameTitle")}</CardTitle>
                    <CardDescription>{t("renameDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="renameUserId">{t("userLabel")}</Label>
                        <Select
                            id="renameUserId"
                            value={renameUserId}
                            onChange={(e) => {
                                setRenameUserId(e.target.value);
                                setRenameAccountId("");
                            }}
                            disabled={loadingUsers || users.length === 0}
                        >
                            {users.length === 0 && <option value="">{t("noUsers")}</option>}
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="renameAccountId">{t("accountLabel")}</Label>
                        <Select
                            id="renameAccountId"
                            value={renameAccountId}
                            onChange={(e) => setRenameAccountId(e.target.value)}
                            disabled={loadingRenameAccounts || renameAccounts.length === 0}
                        >
                            {renameAccounts.length === 0 && <option value="">{t("noAccounts")}</option>}
                            {renameAccounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="renameName">{t("newNameLabel")}</Label>
                        <Input
                            id="renameName"
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                        />
                    </div>
                    {renameResult && <p className="text-sm text-muted-foreground">{renameResult}</p>}
                    <Button onClick={handleRenameAccount} className="w-full">
                        {t("rename")}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("closeTitle")}</CardTitle>
                    <CardDescription>{t("closeDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="closeUserId">{t("userLabel")}</Label>
                        <Select
                            id="closeUserId"
                            value={closeUserId}
                            onChange={(e) => {
                                setCloseUserId(e.target.value);
                                setCloseAccountId("");
                            }}
                            disabled={loadingUsers || users.length === 0}
                        >
                            {users.length === 0 && <option value="">{t("noUsers")}</option>}
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="closeAccountId">{t("accountLabel")}</Label>
                        <Select
                            id="closeAccountId"
                            value={closeAccountId}
                            onChange={(e) => setCloseAccountId(e.target.value)}
                            disabled={loadingCloseAccounts || closeAccounts.length === 0}
                        >
                            {closeAccounts.length === 0 && <option value="">{t("noAccounts")}</option>}
                            {closeAccounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    {closeResult && <p className="text-sm text-muted-foreground">{closeResult}</p>}
                    <Button onClick={handleCloseAccount} className="w-full" variant="outline">
                        {t("close")}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
