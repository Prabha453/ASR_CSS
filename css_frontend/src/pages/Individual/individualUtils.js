export const extractApiList = (res) => {
  const d = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);
};

export const toggleItem = (arr, item) =>
  arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
