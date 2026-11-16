import type { APIRoute } from "astro";
import { experimental_getFontFileURL, fontData } from "astro:assets";
import satori from "satori";
import sharp from "sharp";
import config from "@/config";
import { getFontPathByWeight } from "@/utils/getFontPathByWeight";
import { getOgBrandImageDataUri } from "@/utils/getOgBrandImageDataUri";

export const GET: APIRoute = async context => {
  const fonts = fontData["--font-google-sans-code"];
  const regularFontPath = getFontPathByWeight(fonts, 400);
  const boldFontPath = getFontPathByWeight(fonts, 700);

  if (regularFontPath === undefined || boldFontPath === undefined) {
    throw new Error("Cannot find the font path.");
  }

  const [regularData, boldData, clover] = await Promise.all([
    fetch(experimental_getFontFileURL(regularFontPath, context.url)).then(res =>
      res.arrayBuffer()
    ),
    fetch(experimental_getFontFileURL(boldFontPath, context.url)).then(res =>
      res.arrayBuffer()
    ),
    getOgBrandImageDataUri(),
  ]);

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          background: "#17181e",
          color: "#f7f4fb",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          boxSizing: "border-box",
          fontFamily: "Google Sans Code",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              },
              children: [
                {
                  type: "span",
                  props: {
                    style: {
                      color: "#b9a5d4",
                      fontSize: 25,
                      fontWeight: "bold",
                      letterSpacing: "0.12em",
                    },
                    children: "SECURITY RESEARCH NOTES",
                  },
                },
                {
                  type: "img",
                  props: {
                    src: clover,
                    width: 92,
                    height: 92,
                    style: { objectFit: "contain" },
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", flexDirection: "column", width: "88%" },
              children: [
                {
                  type: "h1",
                  props: {
                    style: {
                      fontSize: 76,
                      lineHeight: 1.05,
                      margin: 0,
                      letterSpacing: "-0.04em",
                    },
                    children: config.site.title,
                  },
                },
                {
                  type: "p",
                  props: {
                    style: {
                      color: "#d7d1df",
                      fontSize: 30,
                      lineHeight: 1.4,
                      margin: "30px 0 0",
                    },
                    children: config.site.description,
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                columnGap: "32px",
                borderTop: "2px solid #75618d",
                paddingTop: "24px",
                fontSize: 21,
              },
              children: [
                {
                  type: "span",
                  props: {
                    children: "Independent application-security research",
                  },
                },
                {
                  type: "span",
                  props: {
                    style: { marginLeft: "auto" },
                    children: new URL(config.site.url).hostname,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: [
        {
          name: "Google Sans Code",
          data: regularData,
          weight: 400,
          style: "normal",
        },
        {
          name: "Google Sans Code",
          data: boldData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(pngBuffer), {
    headers: { "Content-Type": "image/png" },
  });
};
