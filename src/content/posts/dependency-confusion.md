---
author: Amal PK
pubDatetime: 2025-11-11T05:23:01.901Z
title: "Dependency Confusion"
draft: false
tags:
  - "cybersecurity"
  - "hacking"
  - "dependencies"
  - "github"
  - "python"
  - "npm"
  - "supply chain"
description: "Dependency confusion exploits a critical supply chain loophole. Learn how attackers hijack package names and compromise projects through misconfigurations."
collection: application-security/supply-chain-security
---

![Dependency confusion attack against a package registry](/images/posts/dependency-confusion/image-1.webp)


> We use **dependencies** in our code like we use electricity in our homes—quietly, constantly, and without thinking twice.
>
> Whether you’re building a backend service in Go, wiring up a React frontend, or automating something with Python, you’re almost certainly relying on **packages written by other people**. They help us move faster, solve problems without reinventing the wheel, and get real work done. In fact, most modern projects depend on **dozens or even hundreds** of these libraries.
>
> But here’s the part we often overlook:  
> Every time you install a dependency, you’re placing **a huge amount of trust** in it—and in wherever it came from.

## What Are Dependencies?

In simple terms, a **dependency** is just a piece of code your application needs to run. Instead of reinventing the wheel, developers rely on third-party libraries to handle common tasks:

- Need HTTP requests? `axios` or `requests` has you.

- Parsing YAML? `pyyaml` or `go-yaml` to the rescue.

- Generating UUIDs? Pick from dozens of tiny helpers across ecosystems.

These are dependencies—and they're usually managed through something called a **package manager**, which automates fetching, versioning, and updating them.

<div data-node-type="callout">
<div data-node-type="callout-emoji">❓</div>
<div data-node-type="callout-text">But where are all these packages coming from?</div>
</div>

## Package Registries and How They Work

Package registries are public hubs where developers can publish and share code libraries—often called packages. These registries rely heavily on **community contributions**, meaning anyone can create an account and upload their own package.

Once a package is published under a specific name, that name becomes **locked to the account** that created it. No one else can upload a different package using that exact name, which helps prevent accidental conflicts or overwrites.

Below is a table summarizing the package registries for various programming languages:

| **Language** | **Package Manager** | **Registry URL**           |
| ------------ | ------------------- | -------------------------- |
| Node.js      | npm                 | https://registry.npmjs.org |
| Python       | pip                 | https://pypi.org           |
| Golang       | go mod              | https://proxy.golang.org   |
| Rust         | cargo               | https://crates.io          |

> _While most developers rely on official registries like npm, PyPI, or_ [_crates.io_](http://crates.io)_, it’s important to understand that packages don’t always have to come from these sources. Developers can also use private registries, internal mirrors, or even local file-based packages, especially in enterprise environments where code control is critical._

### Security and the Hidden Gap

To protect users, many package registries implement **automated security measures**. For example, new packages may be scanned in sandboxes, checked for known malware patterns, or flagged if they mimic popular packages. These steps are meant to reduce the chances of malicious code slipping through.

_**But here’s the catch**_\*\*:\*\*  
There’s a major security loophole in how package names are managed.

If a maintainer decides to remove a package or unpublish all of its versions, the name essentially becomes up for grabs again. That means anyone including a malicious actor can register that same package name and publish a new version under their control.

And just like that, what used to be a safe, trusted dependency can become a trojan horse, silently reintroduced into projects that never updated their package sources.

### Declaring Dependencies

### Python – `requirements.txt`

In Python, the most common way to declare dependencies is through a `requirements.txt` file. This file lists each required package, along with version constraints that define what can (or cannot) be installed:

```plaintext
txtCopyEditflask==1.1.2     # Install exactly version 1.1.2
requests>=2.24.0            # Install version 2.24.0 or newer
numpy<=1.19.5               # Install version 1.19.5 or older
pandas                      # Install the latest available version
```

This file is then consumed by pip using:

```bash
pip install -r requirements.txt
```

For development environments, teams often maintain a separate `requirements-dev.txt` file that includes tools for testing, linting, or documentation:

```plaintext
pytest==6.2.4
flake8
sphinx
```

This separation of runtime and development dependencies helps ensure clean production deployments.

---

### 🟦 Node.js – `package.json`

Node.js manages its dependencies through a structured JSON file named `package.json`. It defines both runtime and development dependencies, as well as versioning and metadata:

```json
{
  "name": "test-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.17.1", // Matches any 4.x.x version
    "mongoose": "5.12.3" // Locks to a specific version
  },
  "devDependencies": {
    "jest": "^29.0.0" // Development-only packages
  }
}
```

Dependencies are installed using:

```bash
npm install
```

Node.js also supports alternative sources:

- **Remote Git repositories:**

  ```json
  "my-lib": "git+https://github.com/username/my-lib.git"
  ```

- **Local packages (e.g., for monorepos):**

  ```json
  "my-local-lib": "file:../libs/my-local-lib"
  ```

In larger projects, NPM can also use **workspaces** to manage multiple packages locally. This is specified like so:

```json
"workspaces": {
  "packages": ["packages/*"]
}
```

This configuration tells NPM to look for packages in local directories first - before attempting to fetch them from the public registry.

> These configuration files serve as the **entry point for dependency resolution**—which means they are also the first place an attacker may try to exploit weaknesses in the supply chain.

## Understanding the Node.js Dependency Installation Process

In Node.js, dependency management is centered around the `package.json` file, which acts as the manifest for a project. This file outlines the packages required for the application to run and defines supporting metadata such as scripts, entry points, and versioning. Understanding how NPM interprets and installs dependencies is essential to recognizing how misconfigurations can introduce serious vulnerabilities.

Below is an example `package.json` file with various types of dependencies:

```json
{
  "name": "super-project",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "mongoose": "^5.11.15",
    "local-package": "file:../local-package",
    "http-package": "http://example.com/path/to/package.tgz",
    "github-package": "github:user/package",
    "github-package-with-branch": "github:user/package#master",
    "github-package-with-tag": "github:user/package#v1.0.0",
    "github-package-with-commit": "github:user/package#239ea65..."
  },
  "devDependencies": {
    "nodemon": "^2.0.7"
  }
}
```

Parsing the Manifest

The installation process begins with NPM parsing the `package.json` file to identify all declared dependencies. These are categorized into `dependencies`, which are essential for the application in production, and `devDependencies`, which are needed only during development, such as testing tools or linters.

Referencing the Lock File

Once the dependency list is assembled, NPM checks for the presence of a `package-lock.json` file. This file is crucial for ensuring deterministic builds by locking the exact version of each dependency and all of its transitive dependencies. It also helps verify the integrity of installed packages by including cryptographic hashes of previously retrieved versions, thereby offering a basic level of tamper protection.

Local Cache Optimization

Before reaching out to external sources, NPM checks the local cache for any previously downloaded packages. If a required version is found locally, NPM uses it directly. This not only speeds up installation but also reduces exposure to potential supply chain threats by avoiding unnecessary remote fetches.

Source Resolution Hierarchy

Dependencies in `package.json` can be sourced in multiple ways, and NPM follows a specific order to resolve them:

1. **Local Path**

   ```json
   "local-package": "file:../local-package"
   ```

   Pulled directly from the specified local file system path.

2. **Remote URL (Tarball)**

   ```json
   "http-package": "http://example.com/path/to/package.tgz"
   ```

   Retrieved via HTTP as a `.tgz` archive.

3. **GitHub Repository**

   ```json
   "github-package": "github:user/package"
   "github-package-with-branch": "github:user/package#master"
   "github-package-with-tag": "github:user/package#v1.0.0"
   "github-package-with-commit": "github:user/package#<commit-sha>"
   ```

   Pulled from a specific GitHub repository, optionally pinned to a branch, tag, or commit hash.

4. **Public NPM Registry**

   ```json
   "express": "^4.17.1"
   ```

   Fetched from the default public registry at [`https://registry.npmjs.org`](https://registry.npmjs.org).

If NPM fails to locate a dependency locally, via a remote URL, or through Git, it automatically falls back to searching the public NPM registry. While this behavior ensures installation continuity, it introduces a significant security risk when misconfigured.

In practice, fallback issues often arise when a `.npmrc` file—used to configure registry sources—is missing or incorrectly set up. Without this file, private packages may be inadvertently sourced from the public registry if a matching name exists. Additionally, minor typos or changes in internal package names can silently result in the wrong package being installed.

This default behavior creates an opportunity for attackers: by publishing a malicious package with a name that matches or closely resembles an internal dependency, they can exploit systems that mistakenly reach out to the public registry. This is the essence of a dependency confusion attack subtle, yet potentially severe.

## Example of a Dependency Confusion Attack in Node.js

The Setup

The project has the following `package.json` configuration:

```json
{
  "name": "confusion-demo",
  "version": "1.0.0",
  "description": "A demo project for testing dependency resolution",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@acme/private-lib": "^1.0.0",
    "lodash": "^4.17.21"
  },
  "author": "Tech Team",
  "license": "MIT"
}
```

This configuration includes:

- `lodash`, a widely-used public package available on npm.

- `@acme/private-lib`, a presumed internal package scoped under the `@acme` namespace.

In a secure environment, this project also includes a `.npmrc` file that instructs NPM to resolve the `@acme` scope from a private registry:

```javascript
@acme:registry=https://registry.acme.corp/npm/
```

As long as this configuration is in place, running `npm install` correctly resolves `@acme/private-lib` from the internal registry, while public packages like `lodash` are retrieved from the default npm registry.

### Misconfiguration Scenario

Now imagine a scenario where the `.npmrc` file is unintentionally omitted—perhaps during containerization, CI pipeline setup, or an environment rebuild.

Without this registry mapping, NPM has no instructions to resolve the `@acme` scope from the private source. Instead, it reverts to the default behavior and attempts to fetch **all dependencies** from the public registry at [`https://registry.npmjs.org`](https://registry.npmjs.org).

### The result:

- `lodash` installs without issue.

- `@acme/private-lib` fails to resolve, and NPM returns a `404 Not Found` error:

```javascript
npm ERR! 404 Not Found - GET https://registry.npmjs.org/@acme%2fprivate-lib - Not found
npm ERR! 404 '@acme/private-lib@^1.0.0' is not in this registry.
```

At this point, installation fails—but only because the package name is currently _unclaimed_ on the public registry.

### The Attack

An attacker monitoring common namespace patterns or private scope usage may detect that `@acme/private-lib` is unregistered publicly. Recognizing this gap, the attacker can **publish a malicious package** under the same name.

If the attacker pushes a crafted package to npm with the following command:

```bash
npm publish --access public
```

the malicious version of `@acme/private-lib` becomes publicly available.

Now, any environment that attempts to install dependencies **without a correctly configured** `.npmrc` will no longer encounter an error. Instead, NPM silently retrieves and installs the attacker's package from the public registry:

```javascript
added 2 packages, and audited 2 packages in 2s
found 0 vulnerabilities
```

From the user’s perspective, the install appears successful. But under the hood, the malicious version is now in use—completely replacing the expected internal library.

### Outcome and Risk

This form of attack exploits the **ambiguity in package resolution**—specifically the fallback behavior to public registries when private mappings are missing or misconfigured.

Once installed, a malicious package could:

- Run arbitrary scripts during post-installation.

- Steal secrets or tokens.

- Introduce backdoors or additional malicious dependencies.

- Exfiltrate environment variables or sensitive project data.

Because these packages inherit the trusted namespace structure (`@acme`), many teams may not notice the compromise until it's too late—especially in automated environments or CI/CD pipelines.
