import "./globals.css";

export const metadata = {
  title: "NetaBoard — Politics, with receipts.",
  description: "Politics, with receipts. What is happening now, what changed, and what the evidence says.",
  other: { "netaboard-build": process.env.NB_BUILD || "local" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
