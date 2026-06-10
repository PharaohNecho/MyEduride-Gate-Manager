import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { authEmailFromUsername, isValidUsername, normalizeUsername } from '@/lib/auth/username';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const schoolName = (body.schoolName || '').trim();
    const adminFullName = (body.adminFullName || '').trim();
    const adminUsernameRaw = (body.adminUsername || '').trim();
    const adminPassword = (body.adminPassword || '').trim();
    const welcomeMessage = (body.welcomeMessage || '').trim() || `Welcome to ${schoolName}`;

    if (!schoolName || !adminFullName || !adminUsernameRaw || !adminPassword) {
      return NextResponse.json(
        { error: 'All fields: school name, admin full name, username, and password are required.' },
        { status: 400 }
      );
    }

    const adminUsername = normalizeUsername(adminUsernameRaw);
    if (!isValidUsername(adminUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, dots, and underscores.' },
        { status: 400 }
      );
    }

    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const adminEmail = authEmailFromUsername(adminUsername);

    // Case 1: Database/Supabase option is not configured (Demo mode sandbox)
    if (!isSupabaseConfigured()) {
      console.log('Registering school in Sandbox/Demo mode.');
      // Return details mock so they can see success
      return NextResponse.json({
        success: true,
        message: 'School successfully registered in Demo/Sandbox mode! In real mode, configure Supabase credentials.',
        school: {
          id: 'demo-school-id',
          name: schoolName,
          welcome_message: welcomeMessage,
        },
        user: {
          username: adminUsername,
          full_name: adminFullName,
        }
      });
    }

    // Case 2: Supabase is configured! Establish real records
    const supabase = getAdminClient();

    // Check if the username is already taken in the database
    const { data: existingUser, error: checkErr } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', adminUsername)
      .maybeSingle();

    if (checkErr) {
      console.error('[register-school] Error checking existing username:', checkErr.message);
      return NextResponse.json(
        { error: `Database error checking username: ${checkErr.message}` },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken. Please choose a different corporate or personal username.' },
        { status: 400 }
      );
    }

    // A. Generate school ID ahead of time to make a solid linked transaction
    const schoolId = crypto.randomUUID();

    // B. Create the auth user under Supabase auth
    const { data: authResult, error: authCreateErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { login_password: adminPassword },
    });

    if (authCreateErr || !authResult.user) {
      console.error('[register-school] Auth creation failed:', authCreateErr?.message);
      return NextResponse.json(
        { error: `Auth user creation failed: ${authCreateErr?.message || 'Unknown Auth Error'}` },
        { status: 500 }
      );
    }

    const userId = authResult.user.id;

    // C. Create the school record
    const { error: schoolInsErr } = await supabase
      .from('schools')
      .insert({
        id: schoolId,
        name: schoolName,
        approval_status: 'approved', // Auto-approved for frictionless onboarding, as requested
        welcome_message: welcomeMessage,
        primary_color: '#10b981',
      });

    if (schoolInsErr) {
      console.error('[register-school] School record insert failed:', schoolInsErr.message);
      // Try cleaning up auth user in case of transaction failure
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json(
        { error: `Failed to register school: ${schoolInsErr.message}` },
        { status: 500 }
      );
    }

    // D. Create the user profile
    const { error: profileInsErr } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        username: adminUsername,
        email: adminEmail,
        full_name: adminFullName,
      });

    if (profileInsErr) {
      console.error('[register-school] Profile insert failed:', profileInsErr.message);
      // Clean up school and auth user
      await supabase.from('schools').delete().eq('id', schoolId).catch(() => {});
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json(
        { error: `Failed to create admin profile: ${profileInsErr.message}` },
        { status: 500 }
      );
    }

    // E. Link user to the school as school_admin
    const { error: roleInsErr } = await supabase
      .from('user_school_roles')
      .insert({
        user_id: userId,
        school_id: schoolId,
        role: 'school_admin',
        is_active: true,
      });

    if (roleInsErr) {
      console.error('[register-school] Role insert failed:', roleInsErr.message);
      // Clean up
      await supabase.from('user_profiles').delete().eq('id', userId).catch(() => {});
      await supabase.from('schools').delete().eq('id', schoolId).catch(() => {});
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json(
        { error: `Failed to assign administrator role: ${roleInsErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'School and administrator account registered successfully!',
      schoolId: schoolId,
      adminUsername: adminUsername,
    });
  } catch (err: any) {
    console.error('[register-school] Crash exception:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected failure occurred during school registration.' },
      { status: 500 }
    );
  }
}
