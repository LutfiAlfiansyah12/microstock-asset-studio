import { TopNavbar } from "@/components/layout/top-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E6E8F0] dark:bg-background flex flex-col">
      <TopNavbar />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {children}
      </main>
    </div>
  );
}
