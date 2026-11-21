// Küçük, bağımlılıksız çizgi ikonlar. Hepsi süslemedir; yanlarındaki metin anlamı taşır.
import type { ReactNode } from "react";

function Svg({ children, size = 18 }: { children: ReactNode; size?: number }) {
    return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}
export const BrandIcon = () => <Svg size={22}><path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9M7.5 5.25l9 4.5v4.5" /></Svg>;
export const SenderIcon = () => <Svg><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></Svg>;
export const UsersIcon = () => <Svg><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.7-3.2 2.9-4.8 5.5-4.8s4.8 1.6 5.5 4.8M15.5 4.9a3.2 3.2 0 0 1 0 6.2M17.5 14.6c1.6.6 2.6 2 3 4.4" /></Svg>;
export const BadgeIcon = () => <Svg><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><circle cx="12" cy="10" r="2.6" /><path d="M8 16.5c.6-1.7 2.1-2.6 4-2.6s3.4.9 4 2.6" /></Svg>;
export const PinIcon = () => <Svg><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></Svg>;
export const PackageIcon = () => <Svg><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></Svg>;
export const PlusBoxIcon = () => <Svg><path d="M3.5 7.5 12 3l8.5 4.5v4" /><path d="M3.5 7.5v9L12 21M3.5 7.5 12 12l8.5-4.5M12 12v9M18 15v6M15 18h6" /></Svg>;
export const ListIcon = () => <Svg><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></Svg>;
export const TruckIcon = () => <Svg><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" /><circle cx="6.5" cy="17" r="1.8" /><circle cx="17" cy="17" r="1.8" /></Svg>;
export const SearchIcon = () => <Svg><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Svg>;
export const ChartIcon = () => <Svg><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></Svg>;
export const ClockIcon = () => <Svg><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const CheckCircleIcon = () => <Svg><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></Svg>;
export const LogoutIcon = () => <Svg size={16}><path d="M14 4h4.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" /></Svg>;
export const MenuIcon = () => <Svg><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
export const ArrowLeftIcon = () => <Svg size={16}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const ArrowRightIcon = () => <Svg size={16}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const LockIcon = () => <Svg><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></Svg>;
