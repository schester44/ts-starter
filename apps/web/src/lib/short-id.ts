export const shortId = (uuid: string): string => {
  return uuid.slice(0, 5).toLowerCase() as string;
};
