// import type { Config } from "tailwindcss";
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Tokens in index.css use full colors (#hex). Use var() — not hsl(var()) — so utilities resolve. */
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        paper: "var(--paper)",
        signature: "var(--signature)",
        highlight: "var(--highlight)",
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        pulseSoft: 'pulseSoft 1.6s ease-in-out infinite', 
        dot: 'dot 1.4s infinite ease-in-out',
         "confetti-fall": "confetti-fall 1.5s ease-out forwards",
        'orbit-slow': 'orbit 22s linear infinite',
        'orbit-slower': 'orbit 30s linear infinite',
        'orbit-reverse-slower': 'orbitReverse 32s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
         pulseSoft: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(103, 58, 183, 0.4)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 15px 4px rgba(103, 58, 183, 0.2)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(103, 58, 183, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
          "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(120px) rotate(720deg)", opacity: "0" },
        },
         dot: {
          '0%': { opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        orbitReverse: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        }
      }
    },
  },
  plugins: [],
} 
