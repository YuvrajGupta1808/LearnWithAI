# LearnWithAI - Minimalist Video Course Platform

![LearnWithAI thumb](https://github.com/AntonioErdeljac/next14-duoLearnWithAI-clone/assets/23248726/d58e4b55-bb09-456f-978e-f5f31e81b870)

This is a minimalist, video-centric education platform designed for distraction-free learning with future AI chatbot integration.

Key Features:
- 🌐 **Next.js 14 & Server Actions**: High-performance architecture.
- 📺 **Video-Led Learning**: Responsive YouTube video player with "Coming Soon" placeholders for future content.
- 📚 **Book & Chapter Model**: Courses (Subjects) are divided into Units (Books) and Lessons (Chapters).
- 🤖 **AI Chatbot Ready**: Integrated sidebar architecture ready for LLM-driven tutoring.
- 🔐 **Auth using Clerk**: Secure user management and progress tracking.
- 🟠 **Premium Orange UI**: Clean, modern aesthetic with a unified design system.
- 📊 **Dynamic Sidebar**: Navigation that populates automatically based on your active database courses.
- 💾 **PostgresDB using Drizzle**: Lightweight and scalable data model.
- 📱 **Fully Responsive**: Optimized for desktop and mobile learning.


### Prerequisites

**Node version 14.x**

### Cloning the repository

```shell
git clone https://github.com/AntonioErdeljac/next14-duoLearnWithAI-clone.git
```

### Install packages

```shell
npm i
```

### Setup .env file


```js
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
DATABASE_URL="postgresql://..."
STRIPE_API_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_WEBHOOK_SECRET=""
```

### Setup Drizzle ORM

```shell
npm run db:push

```

### Seed the app

```shell
npm run db:seed

```

or

```shell
npm run db:prod

```

### Start the app

```shell
npm run dev
```
