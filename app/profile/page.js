import ProfileClient from "./ProfileClient";

export const metadata = {
  title: "Profile — QuizIn",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
