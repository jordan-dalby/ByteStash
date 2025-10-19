import { ReactNode } from "react";

export const flattenToText = (node: ReactNode): string => {
  if (!node) return "";

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.reduce((text, child) => text + flattenToText(child), "");
  }

  if (typeof node === "object" && "props" in node) {
    return flattenToText(node.props?.children);
  }

  return "";
};
