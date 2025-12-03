import { InputHTMLAttributes, forwardRef } from "react";
import styles from "./atoms.module.css";
import clsx from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={clsx(styles.input, className)} {...rest} />;
});
