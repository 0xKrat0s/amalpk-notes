import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { experimental_getFontFileURL, fontData } from "astro:assets";
import satori from "satori";
import sharp from "sharp";
import config from "@/config";
import { getFontPathByWeight } from "@/utils/getFontPathByWeight";
import { getOgBrandImageDataUri } from "@/utils/getOgBrandImageDataUri";
import { getPostSlug } from "@/utils/getPostPaths";
import { postFilter } from "@/utils/postFilter";

export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) return [];

  const posts = await getCollection("posts").then(posts =>
    posts.filter(post => postFilter(post) && !post.data.ogImage)
  );

  return posts.map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props, url }) => {
  if (!config.features.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }

  const fonts = fontData["--font-google-sans-code"];
  const regularFontPath = getFontPathByWeight(fonts, 400);
  const boldFontPath = getFontPathByWeight(fonts, 700);

  if (regularFontPath === undefined || boldFontPath === undefined) {
    throw new Error("Cannot find the font path.");
  }

  const [regularData, boldData, clover] = await Promise.all([
    fetch(experimental_getFontFileURL(regularFontPath, url)).then(res =>
      res.arrayBuffer()
    ),
    fetch(experimental_getFontFileURL(boldFontPath, url)).then(res =>
      res.arrayBuffer()
    ),
    getOgBrandImageDataUri(),
  ]);

  const titleSize =
    props.data.title.length > 100 ? 48 : props.data.title.length > 70 ? 56 : 64;
  const collection = props.data.collection.replaceAll("-", " ").toUpperCase();
  const description =
    props.data.description.length > 125
      ? `${props.data.description.slice(0, 122).trimEnd()}…`
      : props.data.description;

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
          padding: "64px 76px",
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
                      fontSize: 23,
                      fontWeight: "bold",
                      letterSpacing: "0.1em",
                    },
                    children: collection,
                  },
                },
                {
                  type: "img",
                  props: {
                    src: clover,
                    width: 82,
                    height: 82,
                    style: { objectFit: "contain" },
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
                flexDirection: "column",
                width: "93%",
                maxHeight: 320,
                overflow: "hidden",
              },
              children: [
                {
                  type: "h1",
                  props: {
                    style: {
                      fontSize: titleSize,
                      lineHeight: 1.12,
                      letterSpacing: "-0.035em",
                      margin: 0,
                    },
                    children: props.data.title,
                  },
                },
                {
                  type: "p",
                  props: {
                    style: {
                      color: "#d7d1df",
                      fontSize: 22,
                      lineHeight: 1.35,
                      margin: "22px 0 0",
                      maxHeight: 70,
                      overflow: "hidden",
                      width: "100%",
                    },
                    children: description,
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
                paddingTop: "22px",
                fontSize: 21,
              },
              children: [
                {
                  type: "span",
                  props: { children: `by ${props.data.author}` },
                },
                {
                  type: "span",
                  props: {
                    style: { marginLeft: "auto" },
                    children: "Notes by Amal PK · notes.amalpk.in",
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
