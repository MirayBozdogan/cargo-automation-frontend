// JWT artık JavaScript'in okuyamadığı HttpOnly bir çerezde (cargo_session) tutulur.
// Bu işaret yalnız "bu tarayıcıda giriş yapılmıştı" bilgisidir; gizli değildir ve yetki sağlamaz.
// Giriş yapmamış ziyaretçiyi gereksiz /users/me isteği ve "oturum sona erdi" mesajı olmadan
// giriş ekranına yönlendirmek için kullanılır. Asıl yetki kontrolü her istekte backend'dedir.
const SESSION_HINT_KEY = "signedIn";
// Önceki sürüm JWT'yi bu anahtarla localStorage'da tutuyordu; kalıntısı temizlenir.
const LEGACY_TOKEN_KEY = "token";

export function markSignedIn() {
    try {
        localStorage.setItem(SESSION_HINT_KEY, "1");
        localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch { /* depolama kapalı olabilir */ }
}

export function clearSignedIn() {
    try {
        localStorage.removeItem(SESSION_HINT_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch { /* depolama kapalı olabilir */ }
}

export function hasSessionHint() {
    try { return localStorage.getItem(SESSION_HINT_KEY) === "1"; } catch { return false; }
}
