import AppShell from '@/components/AppShell';
import ActionFormState from '@/components/ActionFormState';
import { createDogRecord } from '@/app/actions/dogActions';
import { requireUser } from '@/lib/auth';

async function createDogState(_prev: { error?: string } | void, formData: FormData) {
  return createDogRecord(formData);
}

export default async function NewDogPage() {
  const { supabase, user } = await requireUser();
  const { data: vet } = await supabase.from('vets').select('clinic_name').eq('id', user.id).single();

  return (
    <AppShell clinicName={vet?.clinic_name}>
      <section className="card">
        <h1>Create Dog Record</h1>
        <ActionFormState action={createDogState} submitLabel="Create dog">
          <div className="grid two">
            <label>
              Microchip number
              <input name="microchip_number" required placeholder="MA-000123" />
            </label>
            <label>
              Dog name
              <input name="name" required />
            </label>
            <label>
              Breed
              <input name="breed" />
            </label>
            <label>
              Birthdate
              <input type="date" name="birthdate" />
            </label>
          </div>

          <h2>Owner details</h2>
          <div className="grid two">
            <label>
              Full name
              <input name="owner_full_name" required />
            </label>
            <label>
              Phone
              <input name="owner_phone" />
            </label>
            <label>
              Email
              <input name="owner_email" type="email" />
            </label>
            <label>
              Address
              <input name="owner_address" />
            </label>
          </div>
        </ActionFormState>
      </section>
    </AppShell>
  );
}
