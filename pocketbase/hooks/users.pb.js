onRecordBeforeUpdateRequest((e) => {
  const authId = e.httpContext.get("authRecord")?.id;
  if (!authId) return;

  const requestingUser = $app.dao().findAuthRecordById("users", authId);
  const isAdmin = requestingUser.get("role") === "admin";
  if (isAdmin) return; // admin pode tudo

  const protectedFields = [
    "role",
    "status",
    "title_points",
    "ninja_rank",
    "level",
    "approved_by",
    "approved_at",
    "organization",
    "current_title",
  ];

  for (const field of protectedFields) {
    if (e.record.get(field) !== e.original.get(field)) {
      throw new BadRequestError("Campo não permitido: " + field);
    }
  }
}, "users");
