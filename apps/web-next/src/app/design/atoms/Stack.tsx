import { HTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./atoms.module.css";

type Direction = "row" | "column";

type Props = HTMLAttributes<HTMLDivElement> & {
    direction?: Direction;
    gap?: number | string;
    align?: "start" | "center" | "end" | "stretch";
    justify?: "start" | "center" | "end" | "between";
};

export function Stack({
    direction = "column",
    gap = 8,
    align = "stretch",
    justify = "start",
    style,
    className,
    ...rest
}: Props) {
    return (
        <div
            className={clsx(styles.stack, className)}
            style={{
                ...style,
                gap: typeof gap === "number" ? `${gap}px` : gap,
                alignItems: align === "start" ? "flex-start" : align === "end" ? "flex-end" : align,
                justifyContent:
                    justify === "start"
                        ? "flex-start"
                        : justify === "end"
                            ? "flex-end"
                            : justify === "between"
                                ? "space-between"
                                : "center",
                flexDirection: direction === "row" ? "row" : "column",
            }}
            {...rest}
        />
    );
}
