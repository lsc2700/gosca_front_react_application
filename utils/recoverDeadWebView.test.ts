import assert from "node:assert/strict";
import test from "node:test";
import {
  WEBVIEW_RECOVERY_MAX,
  decideWebViewRecovery,
  isCancelledWebViewLoad,
  hasWebViewPainted,
  rememberWebViewUrl,
  shouldCoverWithRefresh,
} from "./recoverDeadWebView.ts";

test("렌더러가 죽으면 보고 있던 주소로 웹뷰를 다시 만든다", () => {
  const first = decideWebViewRecovery([], 1_000);
  assert.equal(first.action, "remount");
  assert.deepEqual(first.deaths, [1_000]);
});

test("빈 주소는 저장하지 않는다", () => {
  assert.equal(
    rememberWebViewUrl("https://apis.gosca.co.kr/store", "about:blank"),
    "https://apis.gosca.co.kr/store",
  );
  assert.equal(
    rememberWebViewUrl("https://apis.gosca.co.kr/store", "  "),
    "https://apis.gosca.co.kr/store",
  );
  assert.equal(
    rememberWebViewUrl("https://apis.gosca.co.kr/login", "https://apis.gosca.co.kr/store"),
    "https://apis.gosca.co.kr/store",
  );
});

test("한참 전의 죽음은 다시 세지 않아 한 번 죽어도 복구한다", () => {
  const first = decideWebViewRecovery([], 1_000);
  const later = decideWebViewRecovery(
    first.deaths,
    1_000 + 20_000,
  );
  assert.equal(later.action, "remount");
  assert.deepEqual(later.deaths, [21_000]);
});

test("짧은 시간에 계속 죽으면 재생성 루프를 멈춘다", () => {
  let deaths: number[] = [];
  for (let i = 0; i < WEBVIEW_RECOVERY_MAX; i += 1) {
    const step = decideWebViewRecovery(deaths, 10_000 + i);
    assert.equal(step.action, "remount");
    deaths = step.deaths;
  }
  const stopped = decideWebViewRecovery(deaths, 10_000 + WEBVIEW_RECOVERY_MAX);
  assert.equal(stopped.action, "wait");
});

test("광고가 로딩 완료를 붙잡아도 화면이 그려지기 시작하면 실패로 보지 않는다", () => {
  assert.equal(hasWebViewPainted(0), false);
  assert.equal(hasWebViewPainted(0.09), false);
  assert.equal(hasWebViewPainted(0.1), true);
  assert.equal(hasWebViewPainted(Number.NaN), false);
});

test("로딩이 늦어도 새로고침 버튼으로 가리지 않는다", () => {
  assert.equal(
    shouldCoverWithRefresh({
      reason: "load timed out",
      pageShown: true,
      recovering: false,
    }),
    false,
  );
  assert.equal(
    shouldCoverWithRefresh({
      reason: "load timed out",
      pageShown: false,
      recovering: false,
    }),
    false,
  );
});

test("렌더러가 죽어도 새로고침 버튼은 띄우지 않는다", () => {
  assert.equal(
    shouldCoverWithRefresh({
      reason: "net::ERR_FAILED",
      pageShown: true,
      recovering: false,
    }),
    false,
  );
  assert.equal(
    shouldCoverWithRefresh({
      reason: "renderer gone repeatedly",
      pageShown: true,
      recovering: false,
    }),
    false,
  );
});

test("버튼으로 끊긴 로드는 새로고침 화면이 아니다", () => {
  assert.equal(isCancelledWebViewLoad({ code: -3, description: "net::ERR_ABORTED" }), true);
  assert.equal(isCancelledWebViewLoad({ code: -999, description: "cancelled" }), true);
  assert.equal(
    shouldCoverWithRefresh({
      reason: "net::ERR_ABORTED",
      pageShown: true,
      recovering: false,
      cancelled: true,
    }),
    false,
  );
});
