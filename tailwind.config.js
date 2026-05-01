/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Admin Theme Colors
        admin: {
          primary: "#6366F1", // Indigo
          "primary-hover": "#4F46E5", // Darker Indigo
          secondary: "#3B82F6", // Blue
          accent: "#10B981", // Green
          danger: "#EF4444", // Red
        },

        // Cashier Theme Colors
        cashier: {
          primary: "#0891B2", // Teal
          "primary-hover": "#0E7490", // Darker Teal
          secondary: "#10B981", // Green
          warning: "#F59E0B", // Amber
          danger: "#EF4444", // Red
        },

        // Primary Brand Colors
        primary: {
          DEFAULT: "#2563eb", // blue-600
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb", // Main primary
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },

        // Secondary Colors
        secondary: {
          DEFAULT: "#64748b", // slate-500
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b", // Main secondary
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },

        // Accent Color
        accent: {
          DEFAULT: "#0ea5e9", // sky-500
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9", // Main accent
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },

        // Semantic Colors
        success: {
          DEFAULT: "#10b981", // emerald-500
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // Main success
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },

        warning: {
          DEFAULT: "#f59e0b", // amber-500
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Main warning
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },

        danger: {
          DEFAULT: "#ef4444", // red-500
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444", // Main danger
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
      },

      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Courier New", "monospace"],
      },

      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["32px", { lineHeight: "40px" }],
        "3xl": ["40px", { lineHeight: "48px" }],
        "4xl": ["48px", { lineHeight: "56px" }],

        // Semantic font sizes
        price: ["18px", { lineHeight: "24px", fontWeight: "700" }],
        "price-lg": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "order-number": [
          "14px",
          { lineHeight: "20px", fontWeight: "600", letterSpacing: "0.05em" },
        ],
      },

      spacing: {
        // Additional touch-friendly spacing
        18: "4.5rem", // 72px
        88: "22rem", // 352px
        128: "32rem", // 512px
      },

      minHeight: {
        touch: "48px", // Minimum touch target
        "touch-sm": "36px",
        "touch-lg": "56px",
      },

      minWidth: {
        touch: "48px",
        "touch-sm": "36px",
        "touch-lg": "56px",
      },

      maxWidth: {
        login: "400px",
        "modal-sm": "448px", // 28rem
        "modal-md": "512px", // 32rem
        "modal-lg": "768px", // 48rem
        admin: "1280px", // 80rem
      },

      borderRadius: {
        card: "0.5rem", // 8px
        button: "0.5rem", // 8px
        modal: "0.75rem", // 12px
      },

      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "card-hover":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        modal:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        toast:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      },

      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-in",
        "bounce-subtle": "bounceSubtle 0.5s ease-in-out",
      },

      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },

      zIndex: {
        header: "40",
        modal: "50",
        toast: "60",
      },
    },
  },
  plugins: [],
};
