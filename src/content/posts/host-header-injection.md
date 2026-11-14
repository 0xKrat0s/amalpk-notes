---
author: Amal PK
pubDatetime: 2025-07-04T12:29:54.709Z
title: "Host Header: Small Change, Big Risk"
draft: false
tags:
  - "web security"
  - "http headers"
  - "injection"
description: "Discover how Host Header Injection works, its risks, real-world attack examples, and steps to secure your web applications from this hidden threat."
collection: application-security/web-security
---

![Host header injection attack illustrating a manipulated HTTP Host value](/images/posts/host-header-injection/image-1.webp)

# Host Header: Small Change, Big Risk

> Host Header Injection vulnerabilities can lead to password reset link hijacking, phishing, open redirects, cache poisoning, and more. In this post, we’ll focus on how insecure usage of the Host header can allow attackers to manipulate password reset links — a simple but critical attack vector that’s often overlooked.1

## What are HTTP Headers?

When your browser or any client communicates with a web server, it sends a **request**. This request isn’t just a plain line like "GET /", it also includes a set of key-value pairs known as **HTTP headers**.

These headers give the server important information such as:

- What kind of browser is making the request (`User-Agent`)

- What languages the client prefers (`Accept-Language`)

- What website or domain the request is targeting (`Host`)

Headers play a big role in how a server processes a request.

## What is the Host Header?

The `Host` header is one of the most important headers in an HTTP request. It tells the server **which domain the client is trying to reach**.

### Example:

```http
GET / HTTP/1.1
Host: example.com
```

This is especially useful when one server hosts multiple websites (known as virtual hosting). The server uses the `Host` value to decide which website to respond with.

## Why Is the Host Header Used in Applications?

Many modern web applications use the `Host` header internally for tasks such as:

- Generating absolute URLs (e.g., password reset links, confirmation links)

- Redirecting users to login pages

- Creating `canonical` links for SEO

- Handling multi-tenant routing

But here's the catch: **the** `Host` header is fully controlled by the client. That means an attacker can **change it** to anything they want.

If an application blindly trusts it, trouble follows.

## Host Header Injection in Password Reset Links

Now let's get into the actual vulnerability.

### What is the Vulnerability?

When you click “Forgot password” on most websites, the backend generates a **password reset link** and sends it to your email. The link usually looks like:

```http
https://example.com/reset-password?token=XYZ123
```

Some applications dynamically create this link using the value from the `Host` header:

```http
reset_url = "https://" + request.headers['Host'] + "/reset-password?token=" + token
```

If the `Host` header is not properly validated, an attacker can **inject a fake domain**. The application will generate a link pointing to a malicious website, and email it to the victim.

## How Is It Exploited?

Let’s break down how an attacker can use Host Header Injection to hijack a password reset link.

### Step 1: Attacker knows the victim’s email address

The attacker starts with something simple — they know the email address of the target. This could be from a previous leak, a guess, or just publicly available information.

### Step 2: Attacker visits the “Forgot Password” page

They go to the target website’s password reset page and enter the victim’s email to request a reset link.

### Step 3: Attacker modifies the Host header

Before the request is sent to the server, the attacker changes the `Host` header from the real domain to a domain they control, like this:

```http
Host: attacker.com
```

### Step 4: Server uses the fake Host value to build the reset link

If the server uses the `Host` header directly when creating the password reset link, it might generate a link like:

```http
https://attacker.com/reset-password?token=XYZ123
```

### Step 5: Victim receives a password reset email

The website sends an email to the victim with the reset link — but now that link points to [`attacker.com`](http://attacker.com), not the real website.

### Step 6: Victim clicks the link

Because the email looks legitimate, the victim clicks the link without noticing the wrong domain.

### Step 7: Attacker gets the reset token

Since the attacker controls [`attacker.com`](http://attacker.com), they can see the incoming request and steal the token.

### Step 8: Attacker resets the victim’s password

The attacker takes the stolen token and uses it on the real site to reset the victim’s password — gaining full access to their account.

## Real-World Example (POC)

Let’s say the application code looks like this (Python/Flask):

```python
@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = request.form['email']
    token = generate_reset_token(email)
    reset_link = f"https://{request.headers['Host']}/reset-password?token={token}"
    send_email(email, f"Click to reset your password: {reset_link}")
    return "Email sent"
```

The attacker sends a request like:

```http
POST /forgot-password HTTP/1.1
Host: attacker.com
Content-Type: application/x-www-form-urlencoded

email=victim@example.com
```

The victim receives:

```http
https://attacker.com/reset-password?token=abcd1234
```

Boom. Token leaked.

## How to Mitigate Host Header Injection

### 1\. **Don’t trust the Host header**

Instead of building URLs dynamically using `request.headers['Host']`, always use a **hardcoded and known safe domain**:

```python
reset_link = f"https://example.com/reset-password?token={token}"
```

### 2\. **Whitelist Valid Hostnames**

If your app supports multiple domains, validate the Host header against a list:

```python
host = request.headers['Host']
if host not in ['example.com', 'www.example.com']:
    abort(400)
```

### 3\. **Configure Proxy/CDN properly**

Reverse proxies and load balancers should not pass unvalidated Host headers to the backend.

### 4\. **Enable logging**

Log unusual Host headers for auditing. This helps detect probing or abuse attempts.

## Conclusion

Host Header Injection is often labeled as low severity, but in certain contexts - like password reset flows - it can lead to full account compromise.

Always remember: **never trust user input**, and yes, the Host header counts as user input.

Even though it’s a small header, it can have a big impact.

## References and Real Reports

- [HackerOne Report #226659– Password Reset link hijacking via Host Header Poisoning](https://hackerone.com/reports/226659)

- [PortSwigger Web Security Academy – Host header attacks](https://portswigger.net/web-security/host-header)

- [OWASP Host Header Injection Guide](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection)
