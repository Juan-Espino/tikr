import TikrApp from "~/components/tikr-app";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TikrApp view="portfolio" portfolioId={id} />;
}
