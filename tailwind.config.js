/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(240 10% 8%)",
                foreground: "hsl(0 0% 100%)",
                card: {
                    DEFAULT: "hsl(250 20% 12%)",
                    foreground: "hsl(0 0% 100%)",
                },
                primary: {
                    DEFAULT: "hsl(263 70% 60%)",
                    foreground: "hsl(0 0% 100%)",
                },
                secondary: {
                    DEFAULT: "hsl(263 70% 50%)",
                    foreground: "hsl(0 0% 100%)",
                },
                muted: {
                    DEFAULT: "hsl(240 10% 16%)",
                    foreground: "hsl(240 5% 65%)",
                },
                accent: {
                    DEFAULT: "hsl(263 70% 60%)",
                    foreground: "hsl(0 0% 100%)",
                },
                border: "hsl(240 10% 16%)",
                input: "hsl(240 10% 16%)",
                ring: "hsl(263 70% 60%)",
            },
            borderRadius: {
                lg: "0.5rem",
                md: "calc(0.5rem - 2px)",
                sm: "calc(0.5rem - 4px)",
            },
        },
    },
    plugins: [],
}
