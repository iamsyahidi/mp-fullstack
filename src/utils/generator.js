const generateUnixTimeNow = () => {
  return Math.floor(Date.now() / 1000);
};

export default generateUnixTimeNow;
