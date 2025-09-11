# JAMStack E-commerce & Blog Project

A modern JAMStack website built with Eleventy, featuring a landing page, blog, and e-commerce functionality with integrated payment processing and email services.

## Architecture Overview

This project follows the JAMStack (JavaScript, APIs, Markup) architecture pattern:
- **JavaScript**: Client-side functionality and API integrations
- **APIs**: Headless services for content management, payments, and email
- **Markup**: Pre-built HTML generated at build time

## Technology Stack

### Core Framework
- **[Eleventy (11ty)](https://www.11ty.dev/)** - Static site generator
- **Nunjucks** - Templating engine
- **Sass/SCSS** - CSS preprocessing
- **PostCSS** - CSS post-processing with autoprefixer

### Content Management
- **[TinaCMS](https://tina.io/)** - Git-based headless CMS
- **Markdown** - Content format for blog posts
- **JSON** - Data files for products and configuration

### Hosting & Deployment
- **[GitHub](https://github.com)** - Code repository and version control
- **[Netlify](https://netlify.com)** - Hosting and continuous deployment
- **[Cloudflare](https://cloudflare.com)** - CDN and performance optimization

### Services & APIs
- **[RedSys](https://www.redsys.es/)** - Spanish payment gateway integration
- **[SendGrid](https://sendgrid.com/)** - Email delivery service
- **Netlify Functions** - Serverless functions for API endpoints

### Development Tools
- **npm/Node.js** - Package management and build tools
- **Webpack** - Asset bundling
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting

## 📁 Project Structure

```
project-root/
├── src/
│   ├── _data/
│   │   ├── site.json
│   │   ├── products.json
│   │   └── navigation.json
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk
│   │   │   ├── page.njk
│   │   │   ├── blog.njk
│   │   │   └── product.njk
│   │   ├── components/
│   │   │   ├── header.njk
│   │   │   ├── footer.njk
│   │   │   ├── product-card.njk
│   │   │   └── contact-form.njk
│   │   └── partials/
│   │       ├── head.njk
│   │       └── scripts.njk
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.scss
│   │   │   └── components/
│   │   ├── js/
│   │   │   ├── main.js
│   │   │   ├── cart.js
│   │   │   └── payment.js
│   │   └── images/
│   ├── blog/
│   │   ├── index.njk
│   │   └── posts/
│   │       └── *.md
│   ├── shop/
│   │   ├── index.njk
│   │   ├── product.njk
│   │   └── cart.njk
│   ├── admin/
│   │   └── index.html
│   ├── pages/
│   │   ├── about.njk
│   │   └── contact.njk
│   └── index.njk
├── netlify/
│   └── functions/
│       ├── payment-process.js
│       ├── send-email.js
│       └── webhook-handler.js
├── tina/
│   ├── config.ts
│   └── __generated__/
├── .eleventy.js
├── .tina/
├── package.json
├── netlify.toml
├── _redirects
└── README.md
```

## Features

### Landing Page
- Hero section with call-to-action
- Featured products showcase
- Latest blog posts preview
- Contact form with SendGrid integration
- Responsive design with mobile-first approach

### Blog System
- Markdown-based content creation
- TinaCMS integration for admin editing
- Category and tag filtering
- RSS feed generation
- SEO optimization

### E-commerce
- Product catalog with categories
- Shopping cart functionality
- RedSys payment integration
- Order confirmation emails
- Inventory management

### Admin Panel
- TinaCMS-powered content management
- Live preview editing
- Media management
- User authentication

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- Netlify account
- GitHub account
- Cloudflare account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/campossrg/web_castanya.git
   cd your-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   Create `.env` file:
   ```env
   SENDGRID_API_KEY=your_sendgrid_api_key
   REDSYS_MERCHANT_CODE=your_merchant_code
   REDSYS_SECRET_KEY=your_secret_key
   TINA_TOKEN=your_tina_token
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Start TinaCMS**
   ```bash
   npm run tina:dev
   ```

### Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Link GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `_site`
   - Add environment variables

3. **Configure Cloudflare**
   - Add your Netlify domain to Cloudflare
   - Configure DNS settings
   - Enable CDN and optimization features

## Scripts

```json
{
  "dev": "eleventy --serve",
  "build": "eleventy",
  "tina:dev": "tinacms dev -c \"npm run dev\"",
  "tina:build": "tinacms build",
  "lint": "eslint src/assets/js",
  "format": "prettier --write ."
}
```

## Configuration Files

### Eleventy Configuration (`.eleventy.js`)
- Template engine setup
- Collections configuration
- Plugin integrations
- Asset pipeline

### Netlify Configuration (`netlify.toml`)
- Build settings
- Functions configuration
- Headers and redirects
- Environment variables

### TinaCMS Configuration (`tina/config.ts`)
- Content schema definition
- Collection setup
- Field configurations
- Authentication

## Security & Best Practices

- Environment variables for sensitive data
- HTTPS enforcement via Netlify/Cloudflare
- CSP headers configuration
- Input validation and sanitization
- Secure payment processing with RedSys

## Performance Optimization

- Static site generation for fast loading
- Image optimization and lazy loading
- CSS and JS minification
- Cloudflare CDN integration
- Service worker for offline functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team [campos.srg](campos.srg@gmail.com) or follow the next link: [campossrg.io](https://campossrg.github.io/)

---

Built with ❤️ using the JAMStack architecture