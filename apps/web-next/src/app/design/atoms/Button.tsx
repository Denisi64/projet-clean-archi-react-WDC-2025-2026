import { ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./atoms.module.css";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
    { className, variant = "primary", ...rest },
    ref,
) {
    return (
        <button
            ref={ref}
            className={clsx(styles.button, styles[`button_${variant}`], className)}
            {...rest}
        />
    );
});
