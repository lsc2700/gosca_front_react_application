const variant = process.env.APP_VARIANT || "gosca";
const configFile =
  variant === "lchayim"
    ? "./configs/app.lchayim.json"
    : variant === "anding"
      ? "./configs/app.anding.json"
      : "./configs/app.gosca.json";

const config = JSON.parse(JSON.stringify(require(configFile)));

/** Play 스토어 고스카만 com.user.gosca. 미리보기 APK는 com.gosca.users 유지. */
if (
  variant === "gosca" &&
  process.env.ANDROID_STORE_PACKAGE === "com.user.gosca" &&
  config.expo &&
  config.expo.android
) {
  config.expo.android.package = "com.user.gosca";
  config.expo.android.versionCode = 62;
}

module.exports = config;
