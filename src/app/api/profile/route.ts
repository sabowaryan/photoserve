import { NextResponse } from "next/server";
import { requireSupabaseClient } from "@/lib/auth";
import { handleApiError } from "@/lib/api/error-handler";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function PATCH(request: Request) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const body = await request.json();

    const validatedData = updateProfileSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { name } = validatedData.data;

    const { data, error } = await supabase
      .from("profiles")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
