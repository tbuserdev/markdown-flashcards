import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Markdown-Flashcards",
  description: "Documentation for the fully local Markdown Flashcards",
  base: "/markdown-flashcards/docs/",
  themeConfig: {
    nav: [
      {
        text: "Home",
        link: "/",
      },
      {
        text: "App",
        link: "https://tbuserdev.github.io/markdown-flashcards/",
      },
      {
        text: "GitHub",
        link: "https://github.com/tbuserdev/markdown-flashcards",
      },
      {
        text: "Issues",
        link: "https://github.com/tbuserdev/markdown-flashcards/issues",
      },
    ],

    sidebar: [
      {
        text: "NotebookLM Extractor",
        items: [
          {
            text: "Introduction",
            link: "/notebooklm-extractor/introduction",
          },
          { text: "Usage", link: "/notebooklm-extractor/usage" },
          {
            text: "Export Formats",
            link: "/notebooklm-extractor/export-formats",
          },
          {
            text: "Github Gist Export",
            link: "/notebooklm-extractor/github-gist-export",
          },
          { text: "FAQ", link: "/notebooklm-extractor/faq" },
        ],
      },
      {
        text: "Markdown Flashcards",
        items: [
          {
            text: "Introduction",
            link: "/markdown-flashcards/introduction",
          },
          { text: "Usage", link: "/markdown-flashcards/usage" },
          { text: "FAQ", link: "/markdown-flashcards/faq" },
        ],
      },
      {
        text: "Miscellaneous",
        items: [
          { text: "Changelog", link: "/misc/changelog" },
          { text: "Privacy Policy", link: "/misc/privacy-policy" },
          { text: "Terms of Service", link: "/misc/terms-of-service" },
          { text: "Contact", link: "/misc/contact" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/tbuserdev/markdown-flashcards",
      },
    ],
  },
});
