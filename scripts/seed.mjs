import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function ensureUser(email, password) {
  const { data: users } = await admin.auth.admin.listUsers();
  const existing = users.users.find((u) => u.email === email);
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) throw error;
  return data.user;
}

async function run() {
  const vetA = await ensureUser('vet1@example.ma', 'password123');
  const vetB = await ensureUser('vet2@example.ma', 'password123');

  await admin.from('vets').upsert([
    { id: vetA.id, clinic_name: 'Casablanca Vet Center', phone: '+212600000001' },
    { id: vetB.id, clinic_name: 'Rabat Vet Office', phone: '+212600000002' }
  ]);

  const { data: owner1 } = await admin
    .from('owners')
    .insert({ full_name: 'Ahmed Benali', phone: '+212600000003', address: 'Casablanca' })
    .select('id')
    .single();
  const { data: owner2 } = await admin
    .from('owners')
    .insert({ full_name: 'Sara El Idrissi', phone: '+212600000004', address: 'Rabat' })
    .select('id')
    .single();

  const { data: dog1 } = await admin
    .from('dogs')
    .insert({
      microchip_number: 'MA000001',
      name: 'Rocky',
      breed: 'German Shepherd',
      owner_id: owner1.id,
      primary_vet_id: vetA.id,
      status: 'normal'
    })
    .select('id')
    .single();

  const { data: dog2 } = await admin
    .from('dogs')
    .insert({
      microchip_number: 'MA000002',
      name: 'Luna',
      breed: 'Labrador',
      owner_id: owner2.id,
      primary_vet_id: vetB.id,
      status: 'lost'
    })
    .select('id')
    .single();

  await admin.from('vaccines').insert([
    {
      dog_id: dog1.id,
      vaccine_name: 'Rabies',
      vaccine_date: '2025-01-10',
      next_due_date: '2026-01-10',
      created_by_vet_id: vetA.id
    },
    {
      dog_id: dog2.id,
      vaccine_name: 'DHPP',
      vaccine_date: '2025-02-12',
      next_due_date: '2026-02-12',
      created_by_vet_id: vetB.id
    }
  ]);

  console.log('Seed complete. Users: vet1@example.ma / vet2@example.ma (password123)');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
