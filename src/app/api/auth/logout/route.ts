import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Invalide la session Supabase
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
