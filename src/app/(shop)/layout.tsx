export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto min-h-dvh max-w-md pb-24">{children}</div>;
}
