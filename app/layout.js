import "./globals.css";
import Provider from "./Provider";

export const metadata = {
  title: "LearnWithAI - Your Personal AI Tutor",
  description: "Generate professional, engaging, and comprehensive courses in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
