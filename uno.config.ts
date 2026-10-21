import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
    presets: [presetWind4()],
    preflights: [
        {
            getCSS: () => `
@keyframes drift-a {
  0%   { transform: translate3d(-390px, -390px, 0); }
  50%  { transform: translate3d(calc(100vw - 390px), calc(100vh - 390px), 0); }
  100% { transform: translate3d(-390px, -390px, 0); }
}
@keyframes drift-b {
  0%   { transform: translate3d(-390px, calc(100vh - 390px), 0); }
  50%  { transform: translate3d(calc(100vw - 390px), -390px, 0); }
  100% { transform: translate3d(-390px, calc(100vh - 390px), 0); }
}
@keyframes drift-c {
  0%   { transform: translate3d(-390px, 40vh, 0); }
  50%  { transform: translate3d(calc(100vw - 390px), 60vh, 0); }
  100% { transform: translate3d(-390px, 40vh, 0); }
}
@keyframes drift-d {
  0%   { transform: translate3d(10vw, -390px, 0); }
  50%  { transform: translate3d(72vw, calc(100vh - 390px), 0); }
  100% { transform: translate3d(10vw, -390px, 0); }
}
`,
        },
    ],
    rules: [
        [
            "hex-mask",
            {
                "mask-image":
                    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='63.00' height='36.37' viewBox='0 0 63.00 36.37'><g fill='none' stroke='%23fff' stroke-width='1.4'><path d='M-21.00 0.00L-10.50 -18.19L10.50 -18.19L21.00 0.00L10.50 18.19L-10.50 18.19Z'/><path d='M42.00 0.00L52.50 -18.19L73.50 -18.19L84.00 0.00L73.50 18.19L52.50 18.19Z'/><path d='M10.50 18.19L21.00 0.00L42.00 0.00L52.50 18.19L42.00 36.37L21.00 36.37Z'/><path d='M-52.50 18.19L-42.00 0.00L-21.00 0.00L-10.50 18.19L-21.00 36.37L-42.00 36.37Z'/><path d='M-21.00 36.37L-10.50 18.19L10.50 18.19L21.00 36.37L10.50 54.56L-10.50 54.56Z'/><path d='M42.00 36.37L52.50 18.19L73.50 18.19L84.00 36.37L73.50 54.56L52.50 54.56Z'/></g></svg>\")",
                "-webkit-mask-image":
                    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='63.00' height='36.37' viewBox='0 0 63.00 36.37'><g fill='none' stroke='%23fff' stroke-width='1.4'><path d='M-21.00 0.00L-10.50 -18.19L10.50 -18.19L21.00 0.00L10.50 18.19L-10.50 18.19Z'/><path d='M42.00 0.00L52.50 -18.19L73.50 -18.19L84.00 0.00L73.50 18.19L52.50 18.19Z'/><path d='M10.50 18.19L21.00 0.00L42.00 0.00L52.50 18.19L42.00 36.37L21.00 36.37Z'/><path d='M-52.50 18.19L-42.00 0.00L-21.00 0.00L-10.50 18.19L-21.00 36.37L-42.00 36.37Z'/><path d='M-21.00 36.37L-10.50 18.19L10.50 18.19L21.00 36.37L10.50 54.56L-10.50 54.56Z'/><path d='M42.00 36.37L52.50 18.19L73.50 18.19L84.00 36.37L73.50 54.56L52.50 54.56Z'/></g></svg>\")",
                "mask-size": "63.00px 36.37px",
                "-webkit-mask-size": "63.00px 36.37px",
                "mask-repeat": "repeat",
                "-webkit-mask-repeat": "repeat",
            },
        ],
        [
            "plastic",
            {
                background: "rgba(255,255,255,0.045)",
                "backdrop-filter": "blur(9px)",
                "-webkit-backdrop-filter": "blur(9px)",
                "box-shadow": "inset 0 1px 0 rgba(255,255,255,0.14), 0 12px 32px rgba(0,0,0,0.5)",
            },
        ],
        ["glow-a", { animation: "drift-a 6.4s linear infinite" }],
        ["glow-b", { animation: "drift-b 8.6s linear infinite" }],
        ["glow-c", { animation: "drift-c 10.7s linear infinite" }],
        ["glow-d", { animation: "drift-d 7.9s linear infinite" }],
        [
            "hex",
            {
                "background-image":
                    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='63.00' height='36.37' viewBox='0 0 63.00 36.37'><g fill='none' stroke='%23a78bfa' stroke-opacity='0.16' stroke-width='1'><path d='M-21.00 0.00L-10.50 -18.19L10.50 -18.19L21.00 0.00L10.50 18.19L-10.50 18.19Z'/><path d='M42.00 0.00L52.50 -18.19L73.50 -18.19L84.00 0.00L73.50 18.19L52.50 18.19Z'/><path d='M10.50 18.19L21.00 0.00L42.00 0.00L52.50 18.19L42.00 36.37L21.00 36.37Z'/><path d='M-52.50 18.19L-42.00 0.00L-21.00 0.00L-10.50 18.19L-21.00 36.37L-42.00 36.37Z'/><path d='M-21.00 36.37L-10.50 18.19L10.50 18.19L21.00 36.37L10.50 54.56L-10.50 54.56Z'/><path d='M42.00 36.37L52.50 18.19L73.50 18.19L84.00 36.37L73.50 54.56L52.50 54.56Z'/></g></svg>\")",
                "background-size": "63.00px 36.37px",
            },
        ],
    ],
    theme: {
        colors: {
            ink: "#0d0d12",
            panel: "#0c0c11",
            fg: "#f4f5f7",
            muted: "#8b909a",
            accent: "#a78bfa",
            signal: "#8bd5ca",
            "accent-ink": "#140a24",
        },
    },
});
