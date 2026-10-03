import HomeClient from "@/components/home/HomeClient";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const initialLang = params?.lang;
  return <HomeClient initialLang={initialLang} />;
}
