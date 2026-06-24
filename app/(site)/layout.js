import BottomNav from '@/components/BottomNav';

export default function SiteLayout({ children }) {
  return (
    <div className="pb-16 md:pb-0">
      {children}
      <BottomNav />
    </div>
  );
}
