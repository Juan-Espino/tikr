import PortfolioPage from "./_components/portfolio-page";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortfolioPage id={id} />;
}
