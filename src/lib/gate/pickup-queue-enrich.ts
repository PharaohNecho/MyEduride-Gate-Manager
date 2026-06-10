import { SupabaseClient } from '@supabase/supabase-js';
import { matchPickupPhoto, type PickupPersonRow } from './student-pickup-context';

export async function fetchEnrichedPickupQueue(
  supabase: SupabaseClient,
  schoolId: string,
  options: { today: string; startIso: string; endIso: string; students: any[] }
) {
  try {
    // 1. Fetch all authorized pickup persons for students in this school
    const studentIds = options.students.map((s) => s.id);
    
    let links: any[] = [];
    if (studentIds.length > 0) {
      const { data, error } = await supabase
        .from('pickup_person_students')
        .select(`
          student_id,
          pickup_person:pickup_persons(
            id,
            name,
            phone,
            relationship,
            photo_url,
            is_active
          )
        `)
        .in('student_id', studentIds);
        
      if (!error && data) {
        links = data;
      }
    }

    const pickup_persons_by_student: Record<string, PickupPersonRow[]> = {};
    for (const l of links) {
      if (!l.student_id || !l.pickup_person) continue;
      const person = Array.isArray(l.pickup_person) ? l.pickup_person[0] : l.pickup_person;
      if (!person) continue;

      if (!pickup_persons_by_student[l.student_id]) {
        pickup_persons_by_student[l.student_id] = [];
      }
      pickup_persons_by_student[l.student_id].push({
        id: person.id,
        student_id: l.student_id,
        name: person.name,
        phone: person.phone,
        relationship: person.relationship,
        photo_url: person.photo_url,
        is_active: person.is_active ?? true,
      });
    }

    // 2. Fetch the actual dismissal requests at the gate (pickup queue)
    const { data: requests, error: requestsError } = await supabase
      .from('dismissal_requests')
      .select(`
        id,
        student_id,
        pickup_person_name,
        pickup_person_phone,
        relationship,
        status,
        created_at,
        student:students(
          id,
          first_name,
          last_name,
          student_id_number,
          photo_url
        )
      `)
      .eq('school_id', schoolId)
      .eq('dismissal_date', options.today)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: true });

    if (requestsError) {
      return { pickupQueue: [], pickup_persons_by_student, error: requestsError.message };
    }

    // 3. Enrich the requests with matching photo URLs and list of authorized persons
    const pickupQueue = (requests || []).map((req: any) => {
      const sid = req.student_id;
      const persons = pickup_persons_by_student[sid] || [];
      const matchedPhoto = matchPickupPhoto(req.pickup_person_name, req.pickup_person_phone, persons);

      return {
        ...req,
        pickup_person_photo: matchedPhoto,
        authorised_pickup_persons: persons,
      };
    });

    return {
      pickupQueue,
      pickup_persons_by_student,
    };
  } catch (err: any) {
    console.error('[fetchEnrichedPickupQueue] Exception:', err);
    return { pickupQueue: [], pickup_persons_by_student: {}, error: err?.message || 'Unknown exception' };
  }
}
