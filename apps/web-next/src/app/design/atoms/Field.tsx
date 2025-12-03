import { ReactNode } from "react";
import styles from "./atoms.module.css";
import clsx from "clsx";

type Props = {
    label: string;
    htmlFor?: string;
    children: ReactNode;
    hint?: string;
    className?: string;
};

export function Field({ label, htmlFor, children, hint, className }: Props) {
    return (
        <label className={clsx(styles.field, className)} htmlFor={htmlFor}>
            <span className={styles.fieldLabel}>{label}</span>
            {children}
            {hint && <span className={styles.fieldHint}>{hint}</span>}
        </label>
    );
}
