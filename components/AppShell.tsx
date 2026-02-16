import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function AppShell({
  clinicName,
  children
}: {
  clinicName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="topbar">
        <div>
          <strong>Veto Registry</strong>
          <div className="help">{clinicName ?? 'No clinic profile yet'}</div>
        </div>
        <nav className="actions">
          <Link href="/search">Search</Link>
          <Link href="/dogs/new">New Dog</Link>
          <Link href="/admin">Admin</Link>
          <LogoutButton />
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
