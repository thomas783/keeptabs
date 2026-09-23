import { test } from "node:test";
import assert from "node:assert";
import { useLang, t } from "../i18n.js";

test("default English", () => {
  useLang("en");
  assert.equal(t("save_window"), "Save this window");
});

test("Korean override", () => {
  useLang("ko");
  assert.equal(t("save_window"), "현재 창 저장");
});

test("interpolation with params", () => {
  useLang("en");
  assert.equal(t("saved_toast", { n: 12 }), "12 tabs saved");
  useLang("ko");
  assert.equal(t("saved_n", { n: 3 }), "저장 3");
});

test("useLang ignores an unregistered language (stays on previous)", () => {
  useLang("en");
  useLang("fr"); // not registered → ignored
  assert.equal(t("export"), "Export");
});

test("unknown key returns the key itself", () => {
  useLang("en");
  assert.equal(t("___nope___"), "___nope___");
});

test("popup keys resolve in both languages", () => {
  useLang("en");
  assert.equal(t("popup_save_close"), "Save & close");
  assert.equal(t("popup_close_only"), "Close only");
  assert.equal(t("popup_search_ph"), "Filter tabs");
  useLang("ko");
  assert.equal(t("popup_save_close"), "저장하고 닫기");
  assert.equal(t("popup_close_only"), "닫기만");
  assert.equal(t("popup_search_ph"), "탭 검색");
});

test("popup_count interpolates n and total in both languages", () => {
  useLang("en");
  assert.equal(t("popup_count", { n: 3, total: 5 }), "3 / 5 tabs");
  useLang("ko");
  assert.equal(t("popup_count", { n: 3, total: 5 }), "탭 3 / 5개");
});

test("search keys exist for the vault", () => {
  useLang("ko");
  assert.equal(t("search_ph"), "세션·탭 검색");
  assert.equal(t("no_search_results"), "일치하는 결과가 없어요.");
});
