# Draft and Sign - Electronic Signature Platform

A comprehensive electronic signature platform that allows users to create, edit, sign, and manage documents with legal compliance across 40+ countries.

## 🚀 Live Demo

**Live URL:** https://draft-and-sign-final.netlify.app/

## ✨ Features

- **Electronic Signatures** - Legally binding signatures with compliance across 40+ countries
- **PDF Tools** - 30+ free PDF manipulation tools (convert, edit, merge, compress, secure)
- **Legal Templates** - 45+ professionally drafted legal document templates
- **AI-Powered Features** - Smart document generation and editing assistance
- **Global Compliance** - Meets legal requirements for e-signatures worldwide
- **API Integration** - Developer-friendly REST APIs for automation
- **Mobile Responsive** - Works seamlessly across all devices
- **Real-time Collaboration** - Multi-user document editing and review

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **Lucide React** - Beautiful and consistent icon library

### Development Tools
- **ESLint** - Code linting and quality enforcement
- **PostCSS** - CSS processing and optimization
- **React Router** - Client-side routing

### Deployment
- **Vercel** - Frontend hosting and deployment
- **Git** - Version control

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher) or **yarn**
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ITIO-Innovex/Draft-and-Sign.git
cd draft-and-sign
```

### 2. Navigate to Frontend Directory

```bash
cd Frontend
```

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

### 5. Open in Browser

The application will open automatically at [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage/          # Landing page components
│   │   ├── AuthService/          # Authentication components
│   │   ├── DocumentService/      # Document management
│   │   ├── ESignService/         # E-signature functionality
│   │   ├── PDFService/           # PDF tools and services
│   │   └── TemplateService/      # Legal templates
│   ├── pages/                    # Route pages
│   ├── layouts/                  # Layout components
│   └── assets/                   # Static assets
├── public/                       # Public assets
├── package.json                  # Dependencies and scripts
└── tailwind.config.js           # Tailwind configuration
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🌍 Key Components

### Landing Page
- **Hero Section** - Main value proposition
- **PDF Tools** - Interactive tool showcase
- **Legal Templates** - Template library with live preview
- **Compliance** - Global legal compliance information
- **API Section** - Developer integration details

### Core Features
- **Document Management** - Upload, edit, and organize documents
- **E-Signature Workflow** - Complete signing process
- **Template System** - Customizable legal document templates
- **Compliance Engine** - Legal requirement validation
- **API Integration** - RESTful API for developers

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the Frontend directory:

```env
VITE_API_URL=your_api_url_here
VITE_APP_NAME=Draft and Sign
```

### Tailwind CSS

The project uses Tailwind CSS with custom configuration. Customize colors and components in `tailwind.config.js`.

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Deploy automatically on push to main branch

### Other Platforms

The project can be deployed to any static hosting platform:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 🙏 Acknowledgments

- Icons provided by [Lucide](https://lucide.dev/)
- UI components built with [Tailwind CSS](https://tailwindcss.com/)
- Legal compliance data sourced from official government sources

---

**Made with ❤️ by the Draft and Sign Team**
