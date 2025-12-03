import { SelectHTMLAttributes, forwardRef } from "react";
import styles from "./atoms.module.css";
import clsx from "clsx";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, Props>(function Select({ className, children, ...rest }, ref) {
    return (
        <select ref={ref} className={clsx(styles.select, className)} {...rest}>
            {children}
        </select>
    );
});
