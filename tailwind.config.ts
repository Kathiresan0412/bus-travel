import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#17251f", forest: "#174b38", mint: "#d9f3e5", canvas: "#f4f7f4" }, boxShadow: { card: "0 5px 25px rgba(31,57,44,.06)" } } }, plugins: [] } satisfies Config;
