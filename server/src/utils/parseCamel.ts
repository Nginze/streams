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
      let value = (obj as any)[key];

      if (value instanceof Date) { // Check if the value is a Date object
        (result as any)[camelCaseKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        value = parseCamel(value);
        (result as any)[camelCaseKey] = value;
      } else {
        (result as any)[camelCaseKey] = value;
      }
    });

  return result;
}