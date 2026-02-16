import { notFound } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ActionFormState from '@/components/ActionFormState';
import { addStatusEvent, addVaccine, transferOwner } from '@/app/actions/dogActions';
import { requireUser } from '@/lib/auth';

async function addVaccineState(_prev: { error?: string; success?: string } | void, formData: FormData) {
  return addVaccine(formData);
}

async function addStatusState(_prev: { error?: string; success?: string } | void, formData: FormData) {
  return addStatusEvent(formData);
}

async function transferOwnerState(_prev: { error?: string; success?: string } | void, formData: FormData) {
  return transferOwner(formData);
}

export default async function DogProfilePage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser();

  const [{ data: vet }, { data: dog }, { data: vaccines }, { data: statusEvents }] = await Promise.all([
    supabase.from('vets').select('clinic_name').eq('id', user.id).single(),
    supabase
      .from('dogs')
      .select('*, owner:owners(*)')
      .eq('id', params.id)
      .maybeSingle(),
    supabase
      .from('vaccines')
      .select('*')
      .eq('dog_id', params.id)
      .order('vaccine_date', { ascending: false }),
    supabase
      .from('status_events')
      .select('*')
      .eq('dog_id', params.id)
      .order('created_at', { ascending: false })
  ]);

  if (!dog) notFound();

  const isPrimaryVet = dog.primary_vet_id === user.id;

  return (
    <AppShell clinicName={vet?.clinic_name}>
      <section className="card">
        <h1>{dog.name}</h1>
        <p>
          Chip: <strong>{dog.microchip_number}</strong> · Breed: {dog.breed ?? 'Unknown'}
        </p>
        <p>
          Birthdate: {dog.birthdate ?? 'Unknown'} · Status:{' '}
          <span className={`badge ${dog.status}`}>{dog.status}</span>
        </p>
      </section>

      <section className="card">
        <h2>Owner</h2>
        <p>{dog.owner.full_name}</p>
        <p className="help">
          {dog.owner.phone ?? '-'} · {dog.owner.email ?? '-'} · {dog.owner.address ?? '-'}
        </p>
      </section>

      <section className="card">
        <h2>Add vaccine</h2>
        <ActionFormState action={addVaccineState} submitLabel="Add vaccine">
          <input type="hidden" name="dog_id" value={dog.id} />
          <div className="grid two">
            <label>
              Vaccine name
              <input name="vaccine_name" required />
            </label>
            <label>
              Vaccine date
              <input type="date" name="vaccine_date" required />
            </label>
            <label>
              Next due date
              <input type="date" name="next_due_date" />
            </label>
          </div>
        </ActionFormState>

        <h3>Vaccine history</h3>
        {!vaccines?.length && <p className="help">No vaccines yet.</p>}
        {vaccines?.map((v) => (
          <p key={v.id}>
            {v.vaccine_date} — {v.vaccine_name} (next due: {v.next_due_date ?? 'n/a'})
          </p>
        ))}
      </section>

      <section className="card">
        <h2>Status updates</h2>
        <ActionFormState action={addStatusState} submitLabel="Update status">
          <input type="hidden" name="dog_id" value={dog.id} />
          <div className="grid two">
            <label>
              New status
              <select name="status" defaultValue={dog.status}>
                <option value="normal">Normal</option>
                <option value="lost">Lost</option>
                <option value="stolen">Stolen</option>
                <option value="found">Found</option>
              </select>
            </label>
            <label>
              Notes (optional)
              <input name="notes" />
            </label>
          </div>
        </ActionFormState>

        <h3>Timeline</h3>
        {!statusEvents?.length && <p className="help">No status events yet.</p>}
        {statusEvents?.map((e) => (
          <p key={e.id}>
            {new Date(e.created_at).toLocaleString()} — <strong>{e.status}</strong>
            {e.notes ? `: ${e.notes}` : ''}
          </p>
        ))}
      </section>

      {isPrimaryVet && (
        <section className="card">
          <h2>Transfer owner (primary vet only)</h2>
          <p className="help">This action creates an audit log entry.</p>
          <ActionFormState action={transferOwnerState} submitLabel="Transfer owner">
            <input type="hidden" name="dog_id" value={dog.id} />
            <input type="hidden" name="old_owner_id" value={dog.owner_id} />
            <div className="grid two">
              <label>
                New owner full name
                <input name="new_owner_full_name" required />
              </label>
              <label>
                New owner phone
                <input name="new_owner_phone" />
              </label>
              <label>
                New owner email
                <input name="new_owner_email" type="email" />
              </label>
              <label>
                New owner address
                <input name="new_owner_address" />
              </label>
            </div>
          </ActionFormState>
        </section>
      )}
    </AppShell>
  );
}
