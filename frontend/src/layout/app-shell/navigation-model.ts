import type { NavigationItem } from "@/features/core/types";

export type NavigationNode = NavigationItem & {
  children: NavigationNode[];
};

function normalizePath(path: string): string {
  if (path === "/") {
    return path;
  }

  return path.replace(/\/+$/, "");
}

export function isNavigationPathActive(pathname: string, itemPath: string): boolean {
  const normalizedPathname = normalizePath(pathname);
  const normalizedItemPath = normalizePath(itemPath);

  if (normalizedItemPath === "/") {
    return normalizedPathname === "/";
  }

  return (
    normalizedPathname === normalizedItemPath ||
    normalizedPathname.startsWith(`${normalizedItemPath}/`)
  );
}

export function buildNavigationTree(items: NavigationItem[]): NavigationNode[] {
  const nodes = new Map<string, NavigationNode>();

  for (const item of items) {
    nodes.set(item.key, { ...item, children: [] });
  }

  const roots: NavigationNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parent_key ? nodes.get(node.parent_key) : undefined;

    if (parent && parent.key !== node.key) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodeList: NavigationNode[]) => {
    nodeList.sort((left, right) => left.position - right.position);
    nodeList.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
}

export function findCurrentNavigationItem(
  items: NavigationItem[],
  pathname: string,
): NavigationItem | null {
  return (
    items
      .filter((item) => isNavigationPathActive(pathname, item.path))
      .sort((left, right) => right.path.length - left.path.length)[0] ?? null
  );
}
