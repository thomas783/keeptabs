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
