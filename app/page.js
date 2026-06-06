"use client";

import Button from "@/components/button/Button";
import Title from "@/components/title/Title";

export default function HomePage() {
  return (
    <main>
      <Title subtitle="Create, play, and share quizzes with friends.">
        QuizIn
      </Title>
      <Button onClick={() => alert("Let's quiz!")}>Start a quiz</Button>
    </main>
  );
}
