import AppShell from '@/components/AppShell';
import ActionFormState from '@/components/ActionFormState';
import { saveVetProfile } from '@/app/actions/dogActions';
import { requireUser } from '@/lib/auth';

async function saveProfileState(_prev: { error?: string; success?: string } | void, formData: FormData) {
  return saveVetProfile(formData);
}

export default async function AdminPage() {
  const { supabase, user } = await requireUser();
  const { data: vet } = await supabase.from('vets').select('*').eq('id', user.id).single();

  return (
    <AppShell clinicName={vet?.clinic_name}>
      <section className="card">
        <h1>Vet Profile</h1>
        <p className="help">Complete this once after account creation.</p>
        <ActionFormState action={saveProfileState} submitLabel="Save profile">
          <label>
            Clinic name
            <input name="clinic_name" defaultValue={vet?.clinic_name ?? ''} required />
          </label>
          <label>
            Phone
            <input name="phone" defaultValue={vet?.phone ?? ''} required />
          </label>
        </ActionFormState>
      </section>
    </AppShell>
  );
}
