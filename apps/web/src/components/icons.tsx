import type { SVGProps } from "react";

const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const ArrowUpRight = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><path d="M7 17 17 7M7 7h10v10" /></svg>;
export const BookOpen = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><path d="M3.5 5.5A3.5 3.5 0 0 1 7 2h5v18H7a3.5 3.5 0 0 0-3.5 3V5.5ZM20.5 5.5A3.5 3.5 0 0 0 17 2h-5v18h5a3.5 3.5 0 0 1 3.5 3V5.5Z" /></svg>;
export const ShieldCheck = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>;
export const Layers = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></svg>;
export const Clipboard = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><path d="M9 5h6M9 3h6v4H9zM7 5H5v16h14V5h-2" /><path d="M8 12h8M8 16h5" /></svg>;
export const Sun = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></svg>;
export const Moon = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>;
export const Plus = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><path d="M12 5v14M5 12h14" /></svg>;
export const Refresh = (props: SVGProps<SVGSVGElement>) => <svg {...base} {...props}><path d="M20 11a8 8 0 1 0-2.3 5.7L20 14" /><path d="M20 4v7h-7" /></svg>;
