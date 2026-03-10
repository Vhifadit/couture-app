import Header from "@/components/shared/Header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE6]">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}