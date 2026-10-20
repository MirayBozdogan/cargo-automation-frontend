import type { ReactNode } from "react";

export default function AuthShell({ children }: { children: ReactNode }) {
    return <main className="auth-layout">
        <aside className="auth-intro" aria-label="Kargo otomasyonu hakkında">
            <p className="eyebrow">KARGO OTOMASYONU</p>
            <h2>Gönderilerin için <br />tek bir yer.</h2>
            <p>Adreslerini kaydet, gönderini oluştur ve kayıtlarını kolayca görüntüle.</p>
            <svg className="parcel-art" viewBox="0 0 320 220" fill="none" aria-hidden="true">
                <path d="M30 180H290M45 198H120M230 198H275" stroke="currentColor" strokeOpacity=".18" strokeWidth="2" />
                <path d="M160 30 255 78 160 127 65 78Z" fill="#72d6c8" />
                <path d="M65 78 160 127V218L65 169Z" fill="#249f91" />
                <path d="M160 127 255 78V169L160 218Z" fill="#167d75" />
                <path d="M111 55 207 103V139L184 151V115L89 67Z" fill="#e6bd79" />
                <path d="M84 137 119 155M84 148 107 160" stroke="#b8eee4" strokeWidth="5" strokeLinecap="round" />
                <circle cx="260" cy="35" r="18" fill="#e6bd79" />
                <path d="m252 35 5 5 10-11" stroke="#132f40" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="auth-features">
                <p><span>01</span> Adreslerini yönet</p>
                <p><span>02</span> Kargo ücretini hesapla</p>
                <p><span>03</span> Gönderilerini görüntüle</p>
            </div>
        </aside>
        <section className="auth-panel">{children}</section>
    </main>;
}
