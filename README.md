# CloudNest - Secure Cloud Storage Platform

CloudNest is a modern cloud storage solution built with Next.js 15, offering secure file storage and management with a sophisticated subscription system powered by Stripe and user authentication via Clerk. File storage and delivery is handled by ImageKit for optimized performance and CDN distribution.

## Tech Stack

### **Frontend**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI components
- **[Next Themes](https://github.com/pacocoursey/next-themes)** - Theme management

### **Backend & Database**
- **[Prisma](https://www.prisma.io/)** - Type-safe database ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[Winston](https://github.com/winstonjs/winston)** - Structured logging

### **File Storage & CDN**
- **[ImageKit](https://imagekit.io/)** - Cloud storage, optimization, and CDN delivery

### **Authentication & Payments**
- **[Clerk](https://clerk.com/)** - Complete authentication solution
- **[Stripe](https://stripe.com/)** - Payment processing and subscription management
- **[SVIX](https://www.svix.com/)** - Webhook verification

### **Development Tools**
- **[ESLint 9](https://eslint.org/)** - Code linting
- **[Zod](https://zod.dev/)** - Runtime type validation
- **[Axios](https://axios-http.com/)** - HTTP client

## Complex Webhook Integration

### **Clerk Webhooks**
Handles user lifecycle management:
- **User Registration**: Automatically creates user records and sets up FREE subscriptions
- **Event**: `user.created` - Triggers user setup in database
- **Endpoint**: `/api/webhook/register`

### **Stripe Webhooks** 
Manages complex subscription lifecycle:
- **`customer.subscription.updated`** - Handles plan changes and renewals
- **`customer.subscription.deleted`** - Manages cancellations
- **`invoice.payment_succeeded`** - Processes successful payments and updates subscriptions
- **Endpoint**: `/api/webhook/stripe`

**Payment Flow:**
1. User selects subscription plan
2. Stripe Checkout session created with metadata (userId, plan)
3. Payment processed by Stripe
4. Webhook confirms payment and updates subscription status
5. User gains access to premium features

## Subscription Structure

### **Free Tier**
- 1GB Storage
- Basic File Upload
- File Sharing & Links
- Web Access

### **Pro Monthly** - Dynamic pricing via Stripe
- Everything in Free
- 50GB Storage
- Priority Support
- Advanced Features

### **Pro Yearly** - Dynamic pricing via Stripe (20% discount)
- Everything in Pro Monthly
- 1TB Storage
- Additional Premium Features

*Pricing is dynamically fetched from Stripe and supports flexible billing cycles*

## Getting Started

### **Prerequisites**
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- Clerk account and API keys
- Stripe account and API keys

### **Environment Variables**
Create a `.env.local` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cloudnest"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Stripe Payment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRODUCT_ID="price_..."
STRIPE_PRO_YEARLY_PRODUCT_ID="price_..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **Installation & Setup**

1. **Clone and Install**
```bash
git clone <repository-url>
cd cloudnest
npm install
```

2. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

3. **Development Server**
```bash
npm run dev
```

4. **Production Build**
```bash
npm run build
npm start
```

### **Webhook Configuration**

**Clerk Webhooks:**
- Endpoint: `https://yourdomain.com/api/webhook/register`
- Events: `user.created`
- Signing Secret: Add to `CLERK_WEBHOOK_SECRET`

**Stripe Webhooks:**
- Endpoint: `https://yourdomain.com/api/webhook/stripe`
- Events: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
- Signing Secret: Add to `STRIPE_WEBHOOK_SECRET`

## Security Features

- End-to-end encryption for file storage
- Secure authentication with Clerk
- PCI-compliant Stripe integration
- Webhook signature verification
- Input validation with Zod schemas

---

Built with Next.js, Clerk, and Stripe.
