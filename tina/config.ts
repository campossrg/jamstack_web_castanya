import { defineConfig } from "tinacms";

const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "src", // Ensure this matches your Eleventy input directory
  },
  media: {
    tina: {
      mediaRoot: "assets/assets/images",
      publicFolder: "src",
    },
  },
  schema: {
    collections: [
      {
        name: "blog",
        label: "Blog Posts",
        path: "src/blog/posts",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Publication Date",
            required: true,
          },
          { type: "image", name: "image", label: "Featured Image" },
          { type: "string", name: "imageAlt", label: "Image Alt Text" },
          { type: "string", name: "tags", label: "Tags", list: true },
          { type: "boolean", name: "featured", label: "Featured Post" },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
        ui: {
          // document._sys.filename is standard, but ensure your 11ty routes match
          router: ({ document }) => `/blog/${document._sys.filename}`,
        },
      },
      {
        name: "products",
        label: "Products",
        path: "src/shop/products",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Product Name",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Short Description",
            required: true,
          },
          { type: "number", name: "price", label: "Price (€)", required: true },
          {
            type: "number",
            name: "originalPrice",
            label: "Original Price (€)",
          },
          { type: "string", name: "sku", label: "SKU", required: true },
          {
            type: "number",
            name: "stock",
            label: "Stock Quantity",
            required: true,
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            options: [
              { label: "Electronics", value: "electronics" },
              { label: "Clothing", value: "clothing" },
              { label: "Home & Garden", value: "home-garden" },
              { label: "Sports", value: "sports" },
              { label: "Books", value: "books" },
            ],
            required: true,
          },
          {
            type: "image",
            name: "images",
            label: "Product Images",
            list: true,
          },
          { type: "boolean", name: "featured", label: "Featured Product" },
          {
            type: "boolean",
            name: "available",
            label: "Available for Purchase",
            required: true,
          },
          {
            type: "object",
            name: "specifications",
            label: "Specifications",
            list: true,
            fields: [
              { type: "string", name: "name", label: "Specification Name" },
              { type: "string", name: "value", label: "Value" },
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Detailed Description",
            isBody: true,
          },
        ],
        ui: {
          router: ({ document }) => `/shop/product/${document._sys.filename}`,
        },
      },
      {
        name: "site",
        label: "Site Settings",
        path: "src/_data",
        format: "json",
        // 'match' is deprecated in newer versions for 'ui.allowedActions' or specific paths.
        // I kept your fields but removed the 'match' property as it's usually inferred from 'path'
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Site Title",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Site Description",
            required: true,
          },
          { type: "string", name: "url", label: "Site URL", required: true },
          {
            type: "string",
            name: "lang",
            label: "Language",
            options: [
              { label: "English", value: "en" },
              { label: "Spanish", value: "es" },
              { label: "French", value: "fr" },
              { label: "German", value: "de" },
            ],
            required: true,
          },
          { type: "string", name: "author", label: "Author", required: true },
          { type: "image", name: "logo", label: "Site Logo" },
          {
            type: "object",
            name: "social",
            label: "Social Media Links",
            list: true,
            fields: [
              {
                type: "string",
                name: "name",
                label: "Platform Name",
                options: ["Facebook", "Twitter", "Instagram", "LinkedIn"],
              },
              { type: "string", name: "url", label: "URL" },
            ],
          },
          {
            type: "object",
            name: "contact",
            label: "Contact Information",
            fields: [
              { type: "string", name: "email", label: "Email" },
              { type: "string", name: "phone", label: "Phone" },
              { type: "string", name: "address", label: "Address" },
            ],
          },
          {
            type: "object",
            name: "ecommerce",
            label: "E-commerce Settings",
            fields: [
              {
                type: "string",
                name: "currency",
                label: "Currency",
                options: ["EUR", "USD", "GBP"],
              },
              {
                type: "number",
                name: "freeShippingThreshold",
                label: "Free Shipping Threshold",
              },
              {
                type: "number",
                name: "shippingCost",
                label: "Standard Shipping Cost",
              },
            ],
          },
        ],
      },
      {
        name: "professionalsInspiration",
        label: "Professionals Inspiration",
        path: "src/_data/professionalsInspiration",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          {
            type: "object",
            name: "hero",
            label: "Hero",
            fields: [
              { type: "string", name: "title", label: "Title", required: true },
              {
                type: "string",
                name: "text",
                label: "Text",
                ui: { component: "textarea" },
                required: true,
              },
              {
                type: "string",
                name: "ctaLabel",
                label: "CTA Label",
                required: true,
              },
              {
                type: "string",
                name: "ctaHref",
                label: "CTA Link",
                required: true,
              },
              {
                type: "image",
                name: "backgroundImage",
                label: "Background Image",
                required: true,
              },
              {
                type: "string",
                name: "backgroundAlt",
                label: "Background Alt Text",
                required: true,
              },
            ],
          },
          {
            type: "object",
            name: "foundationsSection",
            label: "Foundations Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
                required: true,
              },
              {
                type: "string",
                name: "intro",
                label: "Section Intro",
                required: true,
              },
              {
                type: "string",
                name: "ctaLabel",
                label: "CTA Label",
                required: true,
              },
              {
                type: "string",
                name: "ctaHref",
                label: "CTA Link",
                required: true,
              },
              {
                type: "object",
                name: "slides",
                label: "Recipe Cards",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Recipe Title",
                    required: true,
                  },
                  {
                    type: "image",
                    name: "image",
                    label: "Image",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "imageAlt",
                    label: "Image Alt Text",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "time",
                    label: "Timing",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "difficulty",
                    label: "Difficulty",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "ingredientsLabel",
                    label: "Ingredients Label",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "ingredients",
                    label: "Ingredients",
                    list: true,
                    required: true,
                  },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "recipesSection",
            label: "Recipes Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
                required: true,
              },
              {
                type: "string",
                name: "intro",
                label: "Section Intro",
                required: true,
              },
              {
                type: "string",
                name: "ctaLabel",
                label: "CTA Label",
                required: true,
              },
              {
                type: "string",
                name: "ctaHref",
                label: "CTA Link",
                required: true,
              },
              {
                type: "object",
                name: "slides",
                label: "Recipe Cards",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Recipe Title",
                    required: true,
                  },
                  {
                    type: "image",
                    name: "image",
                    label: "Image",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "imageAlt",
                    label: "Image Alt Text",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "time",
                    label: "Timing",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "difficulty",
                    label: "Difficulty",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "ingredientsLabel",
                    label: "Ingredients Label",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "ingredients",
                    label: "Ingredients",
                    list: true,
                    required: true,
                  },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "authorRecipesSection",
            label: "Author Recipes Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
                required: true,
              },
              {
                type: "string",
                name: "intro",
                label: "Section Intro",
                required: true,
              },
              {
                type: "string",
                name: "ctaLabel",
                label: "CTA Label",
                required: true,
              },
              {
                type: "string",
                name: "ctaHref",
                label: "CTA Link",
                required: true,
              },
              {
                type: "object",
                name: "slides",
                label: "Recipe Cards",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Recipe Title",
                    required: true,
                  },
                  {
                    type: "image",
                    name: "image",
                    label: "Image",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "imageAlt",
                    label: "Image Alt Text",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "time",
                    label: "Timing",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "difficulty",
                    label: "Difficulty",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "ingredientsLabel",
                    label: "Ingredients Label",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "ingredients",
                    label: "Ingredients",
                    list: true,
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  search: {
    tina: {
      indexerToken: process.env.TINA_SEARCH_TOKEN,
      stopwordLanguages: ["eng", "spa"],
    },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100,
  },
});
