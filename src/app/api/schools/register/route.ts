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
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch {}
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
      try {
        await supabase.from('schools').delete().eq('id', schoolId);
      } catch {}
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch {}
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
      try {
        await supabase.from('user_profiles').delete().eq('id', userId);
      } catch {}
      try {
        await supabase.from('schools').delete().eq('id', schoolId);
      } catch {}
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch {}
      return NextResponse.json(
        { error: `Failed to assign administrator role: ${roleInsErr.message}` },
        { status: 500 }
      );
    }

    // F. Send welcome registration email
    if (adminEmail && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 32px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">MYEDURIDE</h1>
              <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500; tracking: 0.05em; text-transform: uppercase; color: #fbbf24;">Terminal Node Activated Successfully</p>
            </div>
            <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.01em;">Welcome to MyEduRide Gate Control, ${adminFullName}!</h2>
              <p style="font-size: 14px;">Your school registry <strong>${schoolName}</strong> has been successfully initialized on our cloud native gate pass networks. Your administration gateway is live and waiting.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin-top: 0; font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-b: 1px solid #e2e8f0; padding-bottom: 8px;">Your Supervisor Terminal Credentials</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px;">
                  <tr>
                    <td style="color: #64748b; padding: 6px 0; font-weight: 600;">PORTAL WEB ADDRESS</td>
                    <td style="color: #0f172a; padding: 6px 0; text-align: right; font-weight: 700; word-break: break-all;">https://myeduride.com</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 6px 0; font-weight: 600;">USERNAME</td>
                    <td style="color: #0f172a; padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace;">${adminUsername}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 6px 0; font-weight: 600;">EMAIL PROFILE</td>
                    <td style="color: #0f172a; padding: 6px 0; text-align: right; font-weight: 700;">${adminEmail}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 6px 0; font-weight: 600;">TERMINAL ID</td>
                    <td style="color: #1e40af; padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace;">${schoolId}</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 13px; color: #475569;">Using your terminal dashboard, you can now customize student RFID/QR ID templates, keep track of daily entry & exit times, manage classes of students, sync parent-guardian linkage registries, and dispatch instant security notifications automatically.</p>

              <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
                <a href="https://myeduride.com/auth/login" style="background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Access Terminal Control Console</a>
              </div>
            </div>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
              This email is an automated confirmation sent because you registered on the MyEduRide Gate Network.
            </div>
          </div>
        `;

        try {
          await resend.emails.send({
            from: 'MyEduRide Gateway <noreply@assetid.site>',
            to: adminEmail,
            subject: `School Activated on MyEduRide Gate Network: ${schoolName}`,
            html: emailHtml,
          });
        } catch (domainErr: any) {
          console.warn('[register-school] Welcome email failed via domain, retrying via onboarding@resend.dev:', domainErr?.message || domainErr);
          await resend.emails.send({
            from: 'MyEduRide Gate <onboarding@resend.dev>',
            to: adminEmail,
            subject: `School Activated on MyEduRide Gate Network: ${schoolName}`,
            html: emailHtml,
          });
        }
      } catch (err) {
        console.error('[register-school] Welcome email failed:', err);
      }
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
