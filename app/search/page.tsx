import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { requireUser } from '@/lib/auth';

export default async function SearchPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const { supabase, user } = await requireUser();

  const rawQuery = searchParams.q ?? '';
  const q = rawQuery.trim().replace(/\s+/g, '');

  const [{ data: vet }, dogRes] = await Promise.all([
    supabase.from('vets').select('clinic_name').eq('id', user.id).single(),
    q
      ? supabase
          .from('dogs')
          .select('id, microchip_number, name, breed, status')
          .eq('microchip_number', q)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);

  return (
    <AppShell clinicName={vet?.clinic_name}>
      <section className="card">
        <h1>Search Microchip</h1>
        <form action="/search" className="grid">
          <label>
            Microchip number
            <input name="q" defaultValue={rawQuery} placeholder="Paste chip number" autoFocus />
          </label>
          <button type="submit">Search</button>
        </form>
        <p className="help">Exact match only. Spaces are ignored.</p>
      </section>

      {q && (
        <section className="card">
          <h2>Result</h2>
          {dogRes.data ? (
            <>
              <p>
                <strong>{dogRes.data.name}</strong> ({dogRes.data.breed ?? 'Unknown breed'})
              </p>
              <p>
                Chip: {dogRes.data.microchip_number} · Status:{' '}
                <span className={`badge ${dogRes.data.status}`}>{dogRes.data.status}</span>
              </p>
              <Link href={`/dogs/${dogRes.data.id}`}>Open profile</Link>
            </>
          ) : (
            <p className="help">No dog record found for microchip: {q}</p>
          )}
        </section>
      )}
    </AppShell>
  );
}
