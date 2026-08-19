import "./globals.css";

export const metadata = {
  title: "NetaBoard — Live Election Intelligence",
  description: "Predictions, promise tracking, and coalition math for Indian politics — built like a live scoreboard, not a news feed.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
