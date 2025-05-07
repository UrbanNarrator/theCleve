cutlery-shop/
├── App.tsx                  # Main entry point
├── firebaseConfig.ts        # Firebase configuration
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── babel.config.js          # Babel configuration
├── tsconfig.json            # TypeScript configuration
├── assets/                  # Images, fonts, etc.
├── components/              # Reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Header.tsx
│   ├── Loading.tsx
│   └── ProductItem.tsx
├── context/                 # Context providers
│   ├── AuthContext.tsx      # Authentication context
│   └── CartContext.tsx      # Shopping cart context
├── navigation/              # Navigation setup
│   ├── AdminNavigator.tsx   # Admin navigation
│   ├── CustomerNavigator.tsx # Customer navigation
│   └── RootNavigator.tsx    # Root navigation
├── screens/                 # Application screens
│   ├── admin/               # Admin screens
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Products.tsx
│   │   ├── Orders.tsx
│   │   └── Inventory.tsx
│   ├── customer/            # Customer screens
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── Category.tsx
│   │   ├── Orders.tsx
│   │   ├── Checkout.tsx
│   │   └── Profile.tsx
│   └── auth/                # Authentication screens
│       ├── Login.tsx
│       ├── Register.tsx
│       └── ForgotPassword.tsx
├── services/                # Firebase service functions
│   ├── auth.ts              # Authentication functions
│   ├── products.ts          # Product-related functions
│   ├── orders.ts            # Order-related functions
│   └── inventory.ts         # Inventory management functions
└── types/                   # Type definitions
    ├── product.ts
    ├── order.ts
    ├── user.ts
    └── inventory.ts