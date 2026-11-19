import { afterEach, describe, expect, test } from "vitest";
import { clearSignedIn, hasSessionHint, markSignedIn } from "./session";

describe("oturum işareti", () => {
    afterEach(() => localStorage.clear());

    test("giriş sonrası işaret konur, çıkışta kaldırılır", () => {
        expect(hasSessionHint()).toBe(false);
        markSignedIn();
        expect(hasSessionHint()).toBe(true);
        clearSignedIn();
        expect(hasSessionHint()).toBe(false);
    });

    test("önceki sürümden kalan JWT localStorage'dan silinir", () => {
        localStorage.setItem("token", "eski.jwt.degeri");
        markSignedIn();
        expect(localStorage.getItem("token")).toBeNull();
        localStorage.setItem("token", "eski.jwt.degeri");
        clearSignedIn();
        expect(localStorage.getItem("token")).toBeNull();
    });
});
