function syncUserOrganization(e) {
  const userId = e.record.get("user");
  const org = e.record.get("organization");

  const user = $app.dao().findAuthRecordById("users", userId);
  user.set("organization", org);
  $app.dao().saveRecord(user);
}

onRecordAfterCreateRequest((e) => {
  syncUserOrganization(e);
}, "organization_members");

onRecordAfterUpdateRequest((e) => {
  syncUserOrganization(e);
}, "organization_members");

onRecordAfterDeleteRequest((e) => {
  const userId = e.record.get("user");
  const user = $app.dao().findAuthRecordById("users", userId);
  user.set("organization", null);
  $app.dao().saveRecord(user);
}, "organization_members");
