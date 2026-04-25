export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
      {children}
    </div>
  );
}
