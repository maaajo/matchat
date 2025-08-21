import type { ReactNode } from "react";
import { cloneElement, forwardRef, isValidElement } from "react";

export type SlottableProps = {
  asChild?: boolean;
  child?: ReactNode;
  children: (child: ReactNode) => ReactNode;
};

export const Slottable = forwardRef<HTMLElement, SlottableProps>(
  (props, ref) => {
    const { children, asChild, child, ...rest } = props;

    if (!asChild) {
      return children(child);
    }

    if (!isValidElement(child)) {
      return null;
    }

    return cloneElement(
      child,
      // @ts-expect-error - cloneElement expects specific types but we're merging dynamically
      { ref, ...rest },
      // @ts-expect-error - child.props.children type is dynamic
      children(child.props?.children),
    );
  },
);

Slottable.displayName = "Slottable";
