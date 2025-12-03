import { HTMLAttributes, TableHTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./atoms.module.css";

export function Table(props: TableHTMLAttributes<HTMLTableElement>) {
    const { className, ...rest } = props;
    return <table className={clsx(styles.table, className)} {...rest} />;
}

export function TableWrapper({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx(styles.tableWrapper, className)} {...rest} />;
}
