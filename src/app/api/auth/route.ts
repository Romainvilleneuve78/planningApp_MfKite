export async function POST(request: Request) {
  const { password } = await request.json();
  const correctPassword = process.env.AUTH_PASSWORD ?? "Kitesurf";

  if (password === correctPassword) {
    return Response.json({ success: true });
  }

  return Response.json({ success: false, error: "Mot de passe incorrect" }, { status: 401 });
}
