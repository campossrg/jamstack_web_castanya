import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID, // Get this from tina.io
  token: process.env.TINA_TOKEN, // Get this from tina.io

  build: {
    outputFolder: "admin",
    publicFolder: "src",
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
          {
            type: "image",
            name: "image",
            label: "Featured Image",
          },
          {
            type: "string",
            name: "imageAlt",
            label: "Image Alt Text",
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Post",
            description: "Show this post on the homepage",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
        ui: {
          router: ({ document }) => `/blog/${document._sys.filename}`,
          filename: {
            // if disabled, the editor can not edit the filename
            readonly: true,
            // Example of using a custom slugify function
            slugify: (values) => {
              return `${values?.title
                ?.toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '')}`
            },
          },
        },
      },
      {
        name: "products",
        label: "Products",
        path: "src/shop/shop/products",
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
          {
            type: "number",
            name: "price",
            label: "Price (€)",
            required: true,
          },
          {
            type: "number",
            name: "originalPrice",
            label: "Original Price (€)",
            description: "If on sale, enter the original price",
          },
          {
            type: "string",
            name: "sku",
            label: "SKU",
            required: true,
          },
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
          {
            type: "boolean",
            name: "featured",
            label: "Featured Product",
            description: "Show this product on the homepage",
          },
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
              {
                type: "string",
                name: "name",
                label: "Specification Name",
              },
              {
                type: "string",
                name: "value",
                label: "Value",
              },
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
          filename: {
            readonly: true,
            slugify: (values) => {
              return `${values?.title
                ?.toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '')}`
            },
          },
        },
      },
      {
        name: "pages",
        label: "Pages",
        path: "src/pages",
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
            label: "Meta Description",
            required: true,
          },
          {
            type: "string",
            name: "layout",
            label: "Layout",
            options: ["page", "landing"],
            required: true,
          },
          {
            type: "image",
            name: "image",
            label: "Featured Image",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Content",
            isBody: true,
          },
        ],
      },
      {
        name: "site",
        label: "Site Settings",
        path: "src/_data",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        match: {
          include: "site",
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
          {
            type: "string",
            name: "url",
            label: "Site URL",
            required: true,
          },
          {
            type: "string",
            name: "lang",
            label: "Language",
            options: ["en", "es", "fr", "de"],
            required: true,
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true,
          },
          {
            type: "image",
            name: "logo",
            label: "Site Logo",
          },
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
              {
                type: "string",
                name: "url",
                label: "URL",
              },
            ],
          },
          {
            type: "object",
            name: "contact",
            label: "Contact Information",
            fields: [
              {
                type: "string",
                name: "email",
                label: "Email",
              },
              {
                type: "string",
                name: "phone",
                label: "Phone",
              },
              {
                type: "string",
                name: "address",
                label: "Address",
              },
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
    ],
  },
  search: {
    tina: {
      indexerToken: process.env.TINA_SEARCH_TOKEN,
      stopwordLanguages: ['eng', 'spa']
    },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100
  }
});