export function generateUsername(displayName: string) {
  const lowercaseName = displayName.toLowerCase().replace(/\s+/g, "");
  const randomNumber = Math.floor(Math.random() * 10000); // You can adjust the range as needed
  const uniqueUsername = lowercaseName + randomNumber;
  return uniqueUsername;
}
