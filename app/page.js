"use client";

import Link from "next/link";
import Button from "@/components/button/Button";
import Title from "@/components/title/Title";

export default function HomePage() {
  return (
    <main>
      <Title subtitle="Create, play, and share quizzes with friends.">
        QuizIn
      </Title>
      <Link href="/play">
        <Button>Start a quiz</Button>
      </Link>
    </main>
  );
}
