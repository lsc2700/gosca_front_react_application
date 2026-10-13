const { withEntitlementsPlist, withInfoPlist } = require("expo/config-plugins");

/** 아이폰이 입실 스티커의 NDEF 주소를 읽도록 권한과 사용 문구를 넣는다. */
function withIosNfc(config) {
  config = withInfoPlist(config, (next) => {
    next.modResults.NFCReaderUsageDescription =
      next.modResults.NFCReaderUsageDescription ||
      "입실·퇴실 스티커를 읽기 위해 NFC를 사용합니다.";
    return next;
  });
  config = withEntitlementsPlist(config, (next) => {
    next.modResults["com.apple.developer.nfc.readersession.formats"] = ["NDEF"];
    return next;
  });
  return config;
}

module.exports = withIosNfc;
