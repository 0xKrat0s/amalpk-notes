import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://notes.amalpk.in",
    title: "Amal PK",
    description:
      "Application security notes, penetration-testing writeups, and practical security research.",
    author: "Amal PK",
    authorJobTitle: "Application Security Analyst",
    authorKnowsAbout: [
      "Application Security",
      "Web Security",
      "Vulnerability Research",
      "Penetration Testing",
      "API Security",
      "Android Security",
      "Supply Chain Security",
      "Burp Suite",
    ],
    profile: "https://amalpk.in",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Asia/Kolkata",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
    toc: true,
  },
  analytics: {
    gtmId: "GTM-NM9H7KF4",
    consentBanner: true,
  },
  socials: [
    { name: "github", url: "https://github.com/0xkratos" },
    { name: "x", url: "https://x.com/0xkratos" },
    { name: "linkedin", url: "https://www.linkedin.com/in/amalpk/" },
    {
      name: "bluesky",
      url: "https://bsky.app/profile/0xkratos.bsky.social",
    },
    { name: "mail", url: "mailto:hello@amalpk.in" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
