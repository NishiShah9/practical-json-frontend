export const formatContentToJson = (data) => {
  return JSON.stringify(JSON.parse(data), null, 4);
};
