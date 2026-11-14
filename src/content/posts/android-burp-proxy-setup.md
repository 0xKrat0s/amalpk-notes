---
author: Amal PK
pubDatetime: 2026-05-08T06:22:04.558Z
title: "How to Set Up Burp Suite Proxy on Rooted Android with AlwaysTrustUserCerts (Magisk)"
draft: false
tags:
  - "android"
  - "burp suite"
  - "mobile security"
  - "penetration testing"
description: "Configure Burp Suite proxy on rooted Android with Magisk&#x27;s AlwaysTrustUserCerts. Includes certificate conversion (DER→PEM) and install."
collection: android/burp-suite-setup
---

![Burp Suite proxy setup for intercepting traffic from a rooted Android device](/images/posts/android-burp-proxy-setup/image-1.png)

# How to Set Up Burp Suite Proxy on Rooted Android with AlwaysTrustUserCerts (Magisk)

Setting up Burp Suite with Android devices or emulators can be annoying, especially on newer Android versions where user-installed certificates are not trusted by many apps by default.

There are many ways to solve this, but I used a lesser-known and very easy method using a Magisk module called **AlwaysTrustUserCerts**.

This guide explains the process.

## Requirements

Before starting, you need:

- Burp Suite installed on your system

- An Android device or emulator

- Root access on the Android device

- Magisk installed

- AlwaysTrustUserCerts Module installed in Magisk

- OpenSSL installed on your system

- The Android device and Burp machine connected to the same network

Use this only on devices, apps, and traffic you own or are authorized to test.

## Step 1: Export the Burp Suite Certificate

First, open Burp Suite.

Go to:

```text
Proxy > Proxy settings > Import / export CA certificate
```

Export the certificate in **DER format**.

Save it with a name like:

```shell
burp.der
```

## Step 2: Convert the Certificate to PEM Format

Android can install certificates from different formats, but for this method I converted the Burp certificate to `.pem`.

Run:

```shell
openssl x509 -inform DER -in burp.der -out burp.pem
```

Now you should have:

```plaintext
burp.pem
```

## Step 3: Move the Certificate to the Android Device

Transfer the `burp.pem` file to your Android device.

You can use `adb push`:

```shell
adb push burp.pem /sdcard/Download/
```

Or you can copy it manually using file transfer.

## Step 4: Install the Certificate as a User Certificate

On the Android device, go to:

```text
Settings > Security > Encryption & credentials > Install a certificate
```

The exact path may differ depending on the phone or Android version, but it is usually under **Security** or **Privacy/Security** settings.

Select the `burp.pem` file and install it as a **CA certificate**.

At this point, the certificate is installed as a **user certificate**.

However, many Android apps do not trust user-installed certificates. This is where the useful part comes in.

## Step 5: Install AlwaysTrustUserCerts Magisk Module

Download the AlwaysTrustUserCerts Module from Github Releases : [Click To Download](https://github.com/NVISOsecurity/AlwaysTrustUserCerts)

Open Magisk and install the module:

```text
AlwaysTrustUserCerts
```

This module moves or links user-installed CA certificates into the system trusted certificate store, making Android treat them like system certificates.

After installing the module:

1.  Enable the module

2.  Reboot the device

3.  After reboot, confirm the Burp certificate appears under trusted credentials

Now your Burp certificate should be trusted system-wide.

## Step 6: Configure Android Proxy

Now set the Android device to use Burp Suite as its proxy.

### Option 1: Set Proxy from Wi-Fi Settings

Go to your connected Wi-Fi network settings and set:

```text
Proxy: Manual
Host: Your Burp machine IP
Port: 8080
```

Example:

```text
Host: 192.168.1.10
Port: 8080
```

Make sure Burp is listening on the same port.

### Option 2: Set Proxy Using ADB

You can also configure the proxy with ADB:

```shell
adb shell settings put global http_proxy 192.168.1.10:8080
```

To remove the proxy later:

```shell
adb shell settings put global http_proxy :0
```

## Step 7: Start Intercepting Traffic

In Burp Suite, make sure your proxy listener is active and bound to an interface reachable by the Android device.

Now open an app or browser on Android and check Burp.

You should start seeing HTTP and HTTPS traffic.

## Notes

Some apps may still not work if they use certificate pinning. In that case, you may need additional bypass methods such as Frida, Objection, or app patching.

But for many apps and browser traffic, this setup works nicely and avoids manually pushing certificates into Android’s system certificate directory.

## Conclusion

The usual Android Burp certificate setup can be painful, especially on modern Android versions. Using Magisk with the **AlwaysTrustUserCerts** module makes the process much easier.

The flow is simple:

```text
Export Burp cert > Convert to PEM > Install as user cert > Enable AlwaysTrustUserCerts > Reboot > Set proxy
```

After that, your Android device should trust Burp’s CA certificate and route traffic through Burp Suite successfully.

### References

- AlwaysTrustUserCerts (Magisk) — GitHub search (find the module repo and forks):  
  [**https://github.com/search?q=AlwaysTrustUserCerts**](https://github.com/search?q=AlwaysTrustUserCerts)

- Magisk modules (community repo) — browse available modules (may include AlwaysTrustUserCerts):  
  [**https://github.com/Magisk-Modules-Repo/magisk-modules-available**](https://github.com/Magisk-Modules-Repo/magisk-modules-available)

- Burp Suite - Proxy documentation (official PortSwigger docs):  
  [**https://portswigger.net/burp/documentation/desktop/proxy**](https://portswigger.net/burp/documentation/desktop/proxy)

- Burp Suite - Installing or exporting Burp’s CA / certificate (PortSwigger documentation & guides):  
  [**https://portswigger.net/burp/documentation**](https://portswigger.net/burp/documentation)

- OpenSSL - x509 man page (conversion and certificate commands, e.g., DER ↔ PEM):  
  [**https://www.openssl.org/docs/manmaster/man1/openssl-x509.html**](https://www.openssl.org/docs/manmaster/man1/openssl-x509.html)

- OpenSSL Cookbook - practical examples for common OpenSSL commands (convert, inspect, create certs):  
  [**https://www.feistyduck.com/openssl-cookbook/online/**](https://www.feistyduck.com/openssl-cookbook/online/)
