import type { Metadata } from 'next';
import './globals.css';

const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.HTS_NAS_API_URL || '';

export const metadata: Metadata = {
  title: 'HTS NAS Cloud',
  description: 'Remote access interface for the HTS NAS workspace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-api-base={apiBase}>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `window.__HTS_API_URL__ = ${JSON.stringify(apiBase)};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
