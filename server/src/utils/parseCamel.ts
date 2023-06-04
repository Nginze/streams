function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

export function parseCamel<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(parseCamel) as unknown as T;
  }

  const result = {} as T;

  Object.keys(obj)
    .sort()
    .forEach((key) => {
      const camelCaseKey = snakeToCamel(key);
      (result as any)[camelCaseKey] = parseCamel((obj as any)[key]);
    });

  return result;
}
