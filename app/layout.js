import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import './talento.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata = {
  title: 'Talento — AI-Powered Job Search Platform',
  description: 'Multi-agent AI system that searches, filters, applies, and prepares you for jobs automatically.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

import Providers from '@/components/Providers';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
