import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0B5D56" />
        <meta
          name="description"
          content="ScamKill: AI shield helping seniors and families fight phone scams together"
        />

        {/* Google Fonts: Bricolage Grotesque (Headings) + Atkinson Hyperlegible (Readable Body) + Azeret Mono (Digits) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Azeret+Mono:wght@500;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap"
        />

        {/* PWA & iOS/Android Home Screen Metadata */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ScamKill" />
        <meta name="application-name" content="ScamKill" />

        {/* Capture beforeinstallprompt BEFORE React bundle finishes hydrating so it is never missed */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__scamkillDeferredPrompt = null;
              window.__scamkillInstalled = false;
              window.addEventListener('beforeinstallprompt', function (e) {
                e.preventDefault();
                window.__scamkillDeferredPrompt = e;
                window.dispatchEvent(new CustomEvent('scamkill:pwa-prompt-available'));
              });
              window.addEventListener('appinstalled', function () {
                window.__scamkillInstalled = true;
                window.__scamkillDeferredPrompt = null;
                window.dispatchEvent(new CustomEvent('scamkill:pwa-installed'));
              });
            `,
          }}
        />

        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'ionicons';
                src: url('/fonts/Ionicons.ttf') format('truetype');
                font-display: block;
              }
              @font-face {
                font-family: 'Ionicons';
                src: url('/fonts/Ionicons.ttf') format('truetype');
                font-display: block;
              }
              :root {
                --font-display: 'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, sans-serif;
                --font-heading: 'Bricolage Grotesque', 'Atkinson Hyperlegible', sans-serif;
                --font-serif: 'Atkinson Hyperlegible', Georgia, serif;
                --font-rounded: 'Bricolage Grotesque', 'Atkinson Hyperlegible', sans-serif;
                --font-mono: 'Azeret Mono', ui-monospace, monospace;
                --p-scale: 1;
              }
              html, body {
                height: 100%;
                margin: 0;
                background-color: #FAF6EE;
                color: #18181B;
                font-family: var(--font-display);
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
              }
              ::selection {
                background-color: #0B5D56;
                color: #FAF6EE;
              }
              *:focus-visible {
                outline: 3px solid #0B5D56 !important;
                outline-offset: 2px !important;
              }
              @keyframes scamkillBreathe {
                0%, 100% { transform: scale(1); opacity: 0.92; }
                50% { transform: scale(1.06); opacity: 1; }
              }
              @keyframes scamkillRipple {
                0% { transform: scale(0.95); opacity: 0.85; }
                70% { transform: scale(1.12); opacity: 0.25; }
                100% { transform: scale(1.18); opacity: 0; }
              }
              @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                  animation-duration: 0.01ms !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0.01ms !important;
                }
              }
            `,
          }}
        />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
