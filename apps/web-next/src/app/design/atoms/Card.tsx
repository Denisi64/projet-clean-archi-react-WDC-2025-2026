import { HTMLAttributes } from "react";
import styles from "./atoms.module.css";
import clsx from "clsx";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx(styles.card, className)} {...rest} />;
}
