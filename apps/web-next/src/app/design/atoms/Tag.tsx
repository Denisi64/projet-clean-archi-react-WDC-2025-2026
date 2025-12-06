import { ReactNode } from "react";
import styles from "./atoms.module.css";
import clsx from "clsx";

type Variant = "info" | "success" | "warning" | "muted";

type Props = {
    children: ReactNode;
    variant?: Variant;
    className?: string;
};

export function Tag({ children, variant = "info", className }: Props) {
    return <span className={clsx(styles.tag, styles[`tag_${variant}`], className)}>{children}</span>;
}
