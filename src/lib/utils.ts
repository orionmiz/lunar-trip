export const getKeyString = (key: string) => {
  return key.split('').reduce((prev, cur, idx) => {
    if (cur === cur.toLowerCase()) {
      if (idx === 0)
        prev.push(cur.toUpperCase());
      else
        prev.push(cur)
    } else {
      prev.push(` ${cur}`);
    }
    return prev;
  }, [] as string[]).join('');
}