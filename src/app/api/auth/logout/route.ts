import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    // Utiliser le client avec les cookies pour accéder à la session utilisateur
    const supabase = await createClient();

    // Invalide la session Supabase
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Logout error:", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
