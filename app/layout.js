import "./globals.css";

export const metadata = {
  title: "QuizIn",
  description: "QuizIn UI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
