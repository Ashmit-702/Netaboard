import "./globals.css";

export const metadata = {
  title: "NetaBoard — Politics, with receipts.",
  description: "Track what was said. Follow the evidence. See what changed. NetaBoard is an evidence-first political accountability platform, not a news feed.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
