// Devolve o papel (admin/viewer) do usuario autenticado pelo middleware,
// para o frontend decidir o que mostrar/permitir.

export default async function handler(req, res) {
  const role = req.headers["x-app-role"] || "viewer";
  res.status(200).json({ role: role === "admin" ? "admin" : "viewer" });
}
