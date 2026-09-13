const variant = process.env.APP_VARIANT || "gosca";
const configFile =
  variant === "lchayim"
    ? "./configs/app.lchayim.json"
    : variant === "anding"
      ? "./configs/app.anding.json"
      : "./configs/app.gosca.json";

module.exports = require(configFile);
