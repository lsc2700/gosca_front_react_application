import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { handleNfcWebMessage, tokenFromNfcTagUrl } from "./nfcTagToken.ts";

test("입실 주소에서 토큰만 꺼낸다", () => {
  assert.equal(
    tokenFromNfcTagUrl("https://apis.gosca.co.kr/nfc/abc123"),
    "abc123",
  );
  assert.equal(
    tokenFromNfcTagUrl("https://acapay.gosca.co.kr/nfc/abc%2F1?x=1#y"),
    "abc/1",
  );
  assert.equal(tokenFromNfcTagUrl("https://apis.gosca.co.kr/store"), "");
  assert.equal(tokenFromNfcTagUrl("bare-token"), "bare-token");
  assert.equal(tokenFromNfcTagUrl(undefined), "");
});

test("지점이 NFC를 켜면 읽기만 시작하고 설정을 열지 않는다", () => {
  const called: string[] = [];
  const handled = handleNfcWebMessage(
    { type: "GOSCA_NFC", action: "ensure" },
    {
      ensure: () => called.push("ensure"),
      release: () => called.push("release"),
      scan: () => called.push("scan"),
      write: () => called.push("write"),
    },
  );
  assert.equal(handled, true);
  assert.deepEqual(called, ["ensure"]);
});

test("지점이 NFC를 끄면 세션만 내린다", () => {
  const called: string[] = [];
  handleNfcWebMessage(
    { type: "GOSCA_NFC", action: "release" },
    {
      ensure: () => called.push("ensure"),
      release: () => called.push("release"),
      scan: () => called.push("scan"),
      write: () => called.push("write"),
    },
  );
  assert.deepEqual(called, ["release"]);
});

test("아이폰 URI 레코드의 4번은 https 접두다", () => {
  const swift = fs.readFileSync(
    "modules/gosca-nfc-ios/ios/GoscaNfcIosModule.swift",
    "utf8",
  );
  const start = swift.indexOf("private let prefixes");
  const end = swift.indexOf("func start");
  const items = [...swift.slice(start, end).matchAll(/"([^"]*)"/g)].map(
    (match) => match[1],
  );
  assert.equal(items[4], "https://");
  const plugin = fs.readFileSync("plugins/withIosNfc.js", "utf8");
  assert.ok(plugin.includes('"TAG"'));
  assert.equal(plugin.includes('"NDEF"'), false);
  assert.ok(swift.includes("NFCNDEFReaderSession"));
  assert.ok(swift.includes('onEvent?("tag", url)'));
  assert.ok(swift.includes("session?.invalidate()"));
});
