import path from "node:path";
import { mkdir, lstat, realpath } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

// Constant program; no credentials or caller text are interpolated into shell code.
const aclProgram = `
$ErrorActionPreference = 'Stop'
$target = $env:TIKR_VALIDATION_OUTPUT
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$system = [System.Security.Principal.SecurityIdentifier]::new('S-1-5-18')
$acl = [System.Security.AccessControl.DirectorySecurity]::new()
$acl.SetOwner($sid)
$acl.SetAccessRuleProtection($true, $false)
foreach ($account in @($sid, $system)) {
  $rule = [System.Security.AccessControl.FileSystemAccessRule]::new($account, 'FullControl', 'ContainerInherit, ObjectInherit', 'None', 'Allow')
  $acl.AddAccessRule($rule)
}
Set-Acl -LiteralPath $target -AclObject $acl
$actual = Get-Acl -LiteralPath $target
$owner = $actual.GetOwner([System.Security.Principal.SecurityIdentifier]).Value
$rules = @($actual.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier]))
$allowed = @($sid.Value, $system.Value)
if (-not $actual.AreAccessRulesProtected -or $owner -ne $sid.Value -or $rules.Count -ne 2) { throw 'ACL verification failed' }
foreach ($rule in $rules) {
  if ($rule.IsInherited -or $rule.IdentityReference.Value -notin $allowed -or $rule.AccessControlType -ne 'Allow' -or $rule.FileSystemRights -ne 'FullControl' -or $rule.InheritanceFlags -ne 'ContainerInherit, ObjectInherit' -or $rule.PropagationFlags -ne 'None') { throw 'ACL verification failed' }
}
`;

export async function privateDirectory() {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA)
    throw new Error("Windows local private storage required");
  let base = path.resolve(
    process.env.LOCALAPPDATA,
    "Tikr",
    "alpaca-validation",
  );
  const lower = base.toLowerCase();
  for (const name of ["OneDrive", "OneDriveCommercial", "OneDriveConsumer"]) {
    if (!process.env[name]) continue;
    const cloud = path.resolve(process.env[name]).toLowerCase();
    if (lower === cloud || lower.startsWith(cloud + path.sep))
      throw new Error("Cloud-synced output rejected");
  }
  // Reject reparse/symlink ancestors; a relocated local profile must be reviewed separately.
  const ancestors = [];
  for (
    let current = base;
    current !== path.dirname(current);
    current = path.dirname(current)
  )
    ancestors.unshift(current);
  for (const current of ancestors) {
    await mkdir(current).catch((error) => {
      if (error.code !== "EEXIST") throw error;
    });
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink())
      throw new Error("Unsafe output ancestor");
  }
  // MSIX can virtualize LocalAppData writes without a symlink. Accept only
  // a canonical destination still contained by the genuine local-data root.
  const localRoot = (await realpath(process.env.LOCALAPPDATA)).toLowerCase();
  base = await realpath(base);
  if (!base.toLowerCase().startsWith(localRoot + path.sep))
    throw new Error("Output escapes local storage");
  for (
    let current = base;
    current !== path.dirname(current);
    current = path.dirname(current)
  ) {
    if ((await lstat(current)).isSymbolicLink())
      throw new Error("Unsafe canonical ancestor");
  }
  const destination = path.join(base, randomUUID());
  await mkdir(destination);
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      ["SYSTEMROOT", "WINDIR", "TEMP", "TMP"].includes(key.toUpperCase()),
    ),
  );
  env.TIKR_VALIDATION_OUTPUT = destination;
  const powershell = path.join(
    process.env.SystemRoot ?? process.env.SYSTEMROOT,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  execFileSync(
    powershell,
    [
      "-NoProfile",
      "-NonInteractive",
      "-EncodedCommand",
      Buffer.from(aclProgram, "utf16le").toString("base64"),
    ],
    { env, windowsHide: true, stdio: "pipe", timeout: 15000 },
  );
  return destination;
}
