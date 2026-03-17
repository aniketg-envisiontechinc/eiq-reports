import { redirect } from 'next/navigation';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r } = await searchParams;
  const q = r ? `?r=${r}` : '';
  redirect(`/dashboard${q}`);
}
