// Cross-platform stand-in for the previous `cp -r dist/pagefind public/`
// build step: cmd.exe, the shell npm/pnpm runs scripts with on Windows,
// has no `cp`, so the full build used to fail there. Keeping the index in
// public/ lets `astro dev` and subsequent builds serve it.
//
// Also emits `/.well-known/security.txt` (RFC 9116). Vite's publicDir copy
// skips dot-directories, so `public/.well-known/` never reaches `dist/` on
// its own — it has to be written after the build.
import { cpSync, mkdirSync, writeFileSync } from "node:fs";

cpSync("dist/pagefind", "public/pagefind", { recursive: true, force: true });

const SECURITY_TXT = `Contact: mailto:hello@amalpk.in
Expires: 2027-11-14T00:00:00.000Z
Preferred-Languages: en
Canonical: https://notes.amalpk.in/.well-known/security.txt
Policy: https://amalpk.in/
`;

mkdirSync("dist/.well-known", { recursive: true });
writeFileSync("dist/.well-known/security.txt", SECURITY_TXT);
