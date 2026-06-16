import { SupabaseClient } from '@supabase/supabase-js';

export interface PickupPersonRow {
  id: string;
  student_id: string;
  name: string;
  phone: string;
  relationship: string;
  photo_url: string | null;
  is_active: boolean;
}

export function matchPickupPhoto(
  name: string | null | undefined,
  phone: string | null | undefined,
  persons: PickupPersonRow[]
): string | null {
  if (!name || !persons || persons.length === 0) return null;
  
  const normName = name.toLowerCase().trim();
  const normPhone = phone ? phone.replace(/[^0-9]/g, '') : '';

  if (normPhone) {
    const byPhone = persons.find((p) => p.phone && p.phone.replace(/[^0-9]/g, '') === normPhone);
    if (byPhone) return byPhone.photo_url;
  }

  const byName = persons.find((p) => p.name && p.name.toLowerCase().trim() === normName);
  return byName ? byName.photo_url : null;
}

export async function loadPickupPersonsForStudent(
  supabase: SupabaseClient,
  schoolId: string, // parameter matches route call signature
  studentId: string
): Promise<PickupPersonRow[]> {
  try {
    const { data, error } = await supabase
      .from('pickup_person_students')
      .select(`
        student_id,
        pickup_person:pickup_persons(
          id,
          name,
          phone,
          relationship,
          photo_url
        )
      `)
      .eq('student_id', studentId);

    if (error || !data) {
      console.error('[loadPickupPersonsForStudent] Error loading:', error);
      return [];
    }

    return data
      .map((row: any) => {
        const p = Array.isArray(row.pickup_person) ? row.pickup_person[0] : row.pickup_person;
        if (!p) return null;
        return {
          id: p.id,
          student_id: studentId,
          name: p.name,
          phone: p.phone,
          relationship: p.relationship,
          photo_url: p.photo_url,
          is_active: true,
        };
      })
      .filter(Boolean) as PickupPersonRow[];
  } catch (err) {
    console.error('[loadPickupPersonsForStudent] Exception:', err);
    return [];
  }
}
