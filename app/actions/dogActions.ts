'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function asText(formData: FormData, key: string) {
  return (formData.get(key)?.toString() ?? '').trim();
}

export async function createDogRecord(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const microchip_number = asText(formData, 'microchip_number').replace(/\s+/g, '');
  const dogName = asText(formData, 'name');
  const breed = asText(formData, 'breed') || null;
  const birthdate = asText(formData, 'birthdate') || null;

  const ownerData = {
    full_name: asText(formData, 'owner_full_name'),
    phone: asText(formData, 'owner_phone') || null,
    email: asText(formData, 'owner_email') || null,
    address: asText(formData, 'owner_address') || null
  };

  if (!microchip_number || !dogName || !ownerData.full_name) {
    return { error: 'Microchip number, dog name, and owner name are required.' };
  }

  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .insert(ownerData)
    .select('id')
    .single();

  if (ownerError || !owner) {
    return { error: ownerError?.message ?? 'Could not create owner.' };
  }

  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .insert({
      microchip_number,
      name: dogName,
      breed,
      birthdate,
      owner_id: owner.id,
      primary_vet_id: user.id,
      status: 'normal'
    })
    .select('id')
    .single();

  if (dogError || !dog) {
    return {
      error:
        dogError?.code === '23505'
          ? 'Microchip number already exists.'
          : dogError?.message ?? 'Failed to create dog record.'
    };
  }

  revalidatePath('/search');
  redirect(`/dogs/${dog.id}`);
}

export async function addVaccine(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const dog_id = asText(formData, 'dog_id');
  const vaccine_name = asText(formData, 'vaccine_name');
  const vaccine_date = asText(formData, 'vaccine_date');
  const next_due_date = asText(formData, 'next_due_date') || null;

  if (!dog_id || !vaccine_name || !vaccine_date) {
    return { error: 'Vaccine name and date are required.' };
  }

  const { error } = await supabase.from('vaccines').insert({
    dog_id,
    vaccine_name,
    vaccine_date,
    next_due_date,
    created_by_vet_id: user.id
  });

  if (error) return { error: error.message };

  revalidatePath(`/dogs/${dog_id}`);
  return { success: 'Vaccine added.' };
}

export async function addStatusEvent(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const dog_id = asText(formData, 'dog_id');
  const status = asText(formData, 'status') as 'normal' | 'lost' | 'stolen' | 'found';
  const notes = asText(formData, 'notes') || null;

  if (!dog_id || !status) return { error: 'Status is required.' };

  const { error: updateError } = await supabase.from('dogs').update({ status }).eq('id', dog_id);
  if (updateError) return { error: updateError.message };

  const { error: eventError } = await supabase.from('status_events').insert({
    dog_id,
    status,
    notes,
    created_by_vet_id: user.id
  });

  if (eventError) return { error: eventError.message };

  revalidatePath(`/dogs/${dog_id}`);
  return { success: 'Status updated.' };
}

export async function transferOwner(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const dog_id = asText(formData, 'dog_id');
  const old_owner_id = asText(formData, 'old_owner_id');

  const newOwner = {
    full_name: asText(formData, 'new_owner_full_name'),
    phone: asText(formData, 'new_owner_phone') || null,
    email: asText(formData, 'new_owner_email') || null,
    address: asText(formData, 'new_owner_address') || null
  };

  if (!dog_id || !old_owner_id || !newOwner.full_name) {
    return { error: 'New owner full name is required.' };
  }

  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .select('primary_vet_id, owner_id')
    .eq('id', dog_id)
    .single();

  if (dogError || !dog) return { error: 'Dog not found.' };
  if (dog.primary_vet_id !== user.id) {
    return { error: 'Only the primary vet can transfer owner identity.' };
  }

  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .insert(newOwner)
    .select('id, full_name, phone, email, address')
    .single();

  if (ownerError || !owner) return { error: ownerError?.message ?? 'Could not create new owner.' };

  const { error: updateError } = await supabase.from('dogs').update({ owner_id: owner.id }).eq('id', dog_id);

  if (updateError) return { error: updateError.message };

  await supabase.from('audit_logs').insert({
    entity: 'dogs',
    entity_id: dog_id,
    action: 'owner_transfer',
    old_data: { owner_id: old_owner_id },
    new_data: { owner_id: owner.id, ...owner },
    created_by_vet_id: user.id
  });

  revalidatePath(`/dogs/${dog_id}`);
  return { success: 'Owner transfer logged successfully.' };
}

export async function saveVetProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const clinic_name = asText(formData, 'clinic_name') || null;
  const phone = asText(formData, 'phone') || null;

  const { error } = await supabase.from('vets').upsert({ id: user.id, clinic_name, phone });
  if (error) return { error: error.message };

  revalidatePath('/admin');
  revalidatePath('/search');
  return { success: 'Vet profile saved.' };
}
