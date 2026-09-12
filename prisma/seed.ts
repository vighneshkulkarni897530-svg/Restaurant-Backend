import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records (in proper reverse dependency order)
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.waiterCall.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotelSetting.deleteMany();

  // 2. Hotel Settings
  await prisma.hotelSetting.create({
    data: {
      id: 'default',
      hotelName: "Govinda's Restaurant & Dining",
      tagline: 'Authentic Pure Vegetarian Delicacies • QR Smart Table Service',
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
      address: 'Plot 108, Govinda Complex, Heritage Lane, Mumbai 400049',
      phone: '+91 98200 12345',
      email: 'dine@govindas.com',
      currencySymbol: '₹',
      taxRatePercent: 5.0,
      serviceChargePercent: 2.5,
      wifiSsid: 'Govindas_Guest_WiFi',
      wifiPassword: 'WelcomeGovindas',
      enableOnlinePayment: true,
      enableCashPayment: true,
    },
  });

  // 3. Default Users (Admin, Chef, Staff/Waiter)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const chefPassword = await bcrypt.hash('chef123', salt);
  const waiterPassword = await bcrypt.hash('waiter123', salt);

  await prisma.user.createMany({
    data: [
      {
        name: 'Executive Manager',
        email: 'admin@govindas.com',
        passwordHash: adminPassword,
        role: 'ADMIN',
        phone: '+91 98200 11111',
      },
      {
        name: 'Head Chef Sanjeev',
        email: 'chef@govindas.com',
        passwordHash: chefPassword,
        role: 'CHEF',
        phone: '+91 98200 22222',
      },
      {
        name: 'Server Alex',
        email: 'waiter@govindas.com',
        passwordHash: waiterPassword,
        role: 'STAFF',
        phone: '+91 98200 33333',
      },
      {
        name: 'Manager (Legacy Alias)',
        email: 'admin@royalpalms.com',
        passwordHash: adminPassword,
        role: 'ADMIN',
        phone: '+91 98200 11111',
      },
    ],
  });

  // 4. Tables with Unique QR Tokens
  const tablesData = [
    { tableNumber: '01', qrToken: 'tbl_palms_01_a9f1', capacity: 2, section: 'Indoor Bistro', status: 'ACTIVE' },
    { tableNumber: '02', qrToken: 'tbl_palms_02_b8e2', capacity: 4, section: 'Indoor Bistro', status: 'ACTIVE' },
    { tableNumber: '03', qrToken: 'tbl_palms_03_c7d3', capacity: 4, section: 'Indoor Bistro', status: 'ACTIVE' },
    { tableNumber: '04', qrToken: 'tbl_palms_04_d6c4', capacity: 6, section: 'Garden Terrace', status: 'ACTIVE' },
    { tableNumber: '05', qrToken: 'tbl_palms_05_e5b5', capacity: 4, section: 'Garden Terrace', status: 'ACTIVE' },
    { tableNumber: '06', qrToken: 'tbl_palms_06_f4a6', capacity: 8, section: 'Garden Terrace', status: 'ACTIVE' },
    { tableNumber: '07', qrToken: 'tbl_palms_07_g397', capacity: 2, section: 'Rooftop Lounge', status: 'ACTIVE' },
    { tableNumber: '08', qrToken: 'tbl_palms_08_h288', capacity: 4, section: 'Rooftop Lounge', status: 'ACTIVE' },
    { tableNumber: '09', qrToken: 'tbl_palms_09_i179', capacity: 6, section: 'VIP Gazebo', status: 'ACTIVE' },
    { tableNumber: '10', qrToken: 'tbl_palms_10_j060', capacity: 10, section: 'VIP Gazebo', status: 'ACTIVE' },
  ];

  const createdTables = [];
  for (const t of tablesData) {
    const table = await prisma.table.create({ data: t });
    createdTables.push(table);
  }

  // 5. Categories
  const categoriesData = [
    {
      name: 'Chef Specials',
      slug: 'chef-specials',
      description: 'Handcrafted signature dishes curated by our Executive Chef',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      icon: 'Sparkles',
      sortOrder: 1,
    },
    {
      name: 'Starters & Appetizers',
      slug: 'starters',
      description: 'Crisp, fiery and delicious bite-sized beginnings',
      imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
      icon: 'Flame',
      sortOrder: 2,
    },
    {
      name: 'Artisan Pizzas',
      slug: 'pizzas',
      description: 'Wood-fired thin crust Neapolitan pizzas with fresh mozzarella',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      icon: 'Pizza',
      sortOrder: 3,
    },
    {
      name: 'Burgers & Sliders',
      slug: 'burgers',
      description: 'Juicy gourmet burgers served with golden herb fries',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      icon: 'Sandwich',
      sortOrder: 4,
    },
    {
      name: 'Main Course',
      slug: 'main-course',
      description: 'Rich royal gravies, aromatic biryanis and gourmet platters',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
      icon: 'UtensilsCrossed',
      sortOrder: 5,
    },
    {
      name: 'Beverages & Mocktails',
      slug: 'beverages',
      description: 'Refreshing chilled coolers, artisan shakes and brewed coffees',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
      icon: 'Coffee',
      sortOrder: 6,
    },
    {
      name: 'Desserts & Sweets',
      slug: 'desserts',
      description: 'Decadent chocolate delights, cheesecakes and artisanal gelato',
      imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
      icon: 'Cake',
      sortOrder: 7,
    },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.slug] = created.id;
  }

  // 6. Menu Items
  const menuItemsData = [
    // Chef Specials
    {
      categoryId: categoryMap['chef-specials'],
      name: 'Truffle Butter Glazed Paneer Steak',
      description: 'Char-grilled cottage cheese medallions infused with black truffle oil, served over saffron herb risotto.',
      price: 490,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: true,
      spicyLevel: 1,
      preparationTimeMin: 20,
      calories: 420,
    },
    {
      categoryId: categoryMap['chef-specials'],
      name: 'Smoked Butter Chicken Supreme',
      description: 'Tender tandoor-roasted chicken in a velvety slow-simmered makhani gravy with smoked charcoal aroma.',
      price: 540,
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
      isVeg: false,
      isChefSpecial: true,
      spicyLevel: 2,
      preparationTimeMin: 25,
      calories: 560,
    },
    {
      categoryId: categoryMap['chef-specials'],
      name: 'Royal Awadhi Dum Biryani',
      description: 'Fragrant aged Basmati rice layered with marinated paneer & dry fruits, slow-cooked in a sealed clay pot.',
      price: 460,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: true,
      spicyLevel: 2,
      preparationTimeMin: 25,
      calories: 510,
    },

    // Starters
    {
      categoryId: categoryMap['starters'],
      name: 'Crispy Peri-Peri Cheese Cigars',
      description: 'Golden fried crispy spring rolls bursting with molten mozzarella, jalapenos, and house dip.',
      price: 290,
      imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: false,
      spicyLevel: 2,
      preparationTimeMin: 12,
      calories: 340,
    },
    {
      categoryId: categoryMap['starters'],
      name: 'Honey Chilli Garlic Lotus Stem',
      description: 'Crunchy wok-tossed lotus stem slices glazed in spicy honey chilli sauce with roasted sesame.',
      price: 320,
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: false,
      spicyLevel: 2,
      preparationTimeMin: 15,
      calories: 280,
    },
    {
      categoryId: categoryMap['starters'],
      name: 'Smoky Malai Chicken Tikka',
      description: 'Juicy boneless chicken thighs marinated in rich cashew cream, cardamom, and green chillies.',
      price: 390,
      imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
      isVeg: false,
      isChefSpecial: false,
      spicyLevel: 1,
      preparationTimeMin: 18,
      calories: 410,
    },

    // Artisan Pizzas
    {
      categoryId: categoryMap['pizzas'],
      name: 'Margherita Burrata Speciale',
      description: 'San Marzano tomato sauce, fresh buffalo burrata, garden basil, and extra virgin olive oil on hand-stretched dough.',
      price: 420,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: true,
      spicyLevel: 0,
      preparationTimeMin: 18,
      calories: 620,
    },
    {
      categoryId: categoryMap['pizzas'],
      name: 'Fiery BBQ Paneer & Bell Pepper Pizza',
      description: 'Zesty barbecue sauce, spiced roasted paneer, grilled bell peppers, red onions, and smoked cheddar.',
      price: 460,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: false,
      spicyLevel: 2,
      preparationTimeMin: 20,
      calories: 680,
    },
    {
      categoryId: categoryMap['pizzas'],
      name: 'Pepperoni & Smoked Sausage Pizza',
      description: 'Classic Italian pepperoni slices, spicy chicken sausage, black olives, oregano, and double mozzarella.',
      price: 520,
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
      isVeg: false,
      isChefSpecial: false,
      spicyLevel: 2,
      preparationTimeMin: 20,
      calories: 740,
    },

    // Burgers
    {
      categoryId: categoryMap['burgers'],
      name: 'Ultimate Truffle Mushroom Crunch Burger',
      description: 'Crispy fried herb mushroom patty, swiss cheese melt, caramelized onions, and truffle aioli in a brioche bun.',
      price: 340,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: false,
      spicyLevel: 1,
      preparationTimeMin: 15,
      calories: 540,
    },
    {
      categoryId: categoryMap['burgers'],
      name: 'Double Cheddar Gourmet Chicken Smash',
      description: 'Two grilled chicken patties, double vintage cheddar, spicy ranch slaw, and gherkins served with waffle fries.',
      price: 390,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      isVeg: false,
      isChefSpecial: true,
      spicyLevel: 2,
      preparationTimeMin: 18,
      calories: 680,
    },

    // Main Course
    {
      categoryId: categoryMap['main-course'],
      name: 'Paneer Lababdar & Garlic Butter Naan',
      description: 'Soft cottage cheese chunks cooked in rich onion-tomato masala with grated paneer and creamy butter swirl.',
      price: 380,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: false,
      spicyLevel: 2,
      preparationTimeMin: 20,
      calories: 520,
    },
    {
      categoryId: categoryMap['main-course'],
      name: 'Dal Bukhara (Slow Cooked 18 Hours)',
      description: 'Legendary black lentils simmered overnight with tomatoes, cream, and pure butter on charcoal embers.',
      price: 340,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: true,
      spicyLevel: 1,
      preparationTimeMin: 15,
      calories: 460,
    },

    // Beverages
    {
      categoryId: categoryMap['beverages'],
      name: 'Sparkling Passion Fruit & Mint Mojito',
      description: 'Zesty crushed fresh lime, garden mint leaves, organic passion fruit pulp, and effervescent soda over crushed ice.',
      price: 210,
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: false,
      spicyLevel: 0,
      preparationTimeMin: 8,
      calories: 140,
    },
    {
      categoryId: categoryMap['beverages'],
      name: 'Classic Hazelnut Cold Brew Frappe',
      description: 'Single-origin Arabica cold brew espresso blended with roasted hazelnut cream, chocolate drizzle, and vanilla bean cream.',
      price: 240,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: false,
      spicyLevel: 0,
      preparationTimeMin: 8,
      calories: 220,
    },

    // Desserts
    {
      categoryId: categoryMap['desserts'],
      name: 'Molten Belgian Chocolate Lava Cake',
      description: 'Warm dark chocolate cake with a gushing molten ganache center, paired with Madagascar vanilla bean gelato.',
      price: 280,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: true,
      spicyLevel: 0,
      preparationTimeMin: 12,
      calories: 450,
    },
    {
      categoryId: categoryMap['desserts'],
      name: 'New York Baked Berry Cheesecake',
      description: 'Velvety Philadelphia cream cheese filling on a buttery graham cracker crust, topped with wild blueberry compote.',
      price: 310,
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80',
      isVeg: true,
      isChefSpecial: false,
      spicyLevel: 0,
      preparationTimeMin: 10,
      calories: 380,
    },
  ];

  const createdMenuItems = [];
  for (const item of menuItemsData) {
    const created = await prisma.menuItem.create({ data: item });
    createdMenuItems.push(created);
  }

  // 7. Seed 2 Realistic Sample Orders (to populate dashboard on initial boot)
  const sampleOrder1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1001',
      tableId: createdTables[1].id, // Table 02
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 12345',
      notes: 'Make it medium spicy, please deliver extra napkins.',
      status: 'PREPARING',
      paymentStatus: 'PAID',
      subtotal: 710,
      tax: 35.5,
      serviceCharge: 17.75,
      total: 763.25,
      items: {
        create: [
          {
            menuItemId: createdMenuItems[6].id, // Margherita Burrata
            name: createdMenuItems[6].name,
            quantity: 1,
            unitPrice: 420,
            itemTotal: 420,
          },
          {
            menuItemId: createdMenuItems[3].id, // Peri Peri Cigars
            name: createdMenuItems[3].name,
            quantity: 1,
            unitPrice: 290,
            itemTotal: 290,
          },
        ],
      },
      payment: {
        create: {
          provider: 'ONLINE_RAZORPAY',
          providerOrderId: 'order_mock_demo_01',
          providerPaymentId: 'pay_mock_demo_01',
          amount: 763.25,
          status: 'COMPLETED',
          paymentMethod: 'UPI',
        },
      },
    },
  });

  const sampleOrder2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1002',
      tableId: createdTables[4].id, // Table 05
      customerName: 'Priya & Friends',
      customerPhone: '+91 98111 22233',
      notes: 'Less ice in mojitos.',
      status: 'NEW',
      paymentStatus: 'PAID',
      subtotal: 1060,
      tax: 53.0,
      serviceCharge: 26.5,
      total: 1139.5,
      items: {
        create: [
          {
            menuItemId: createdMenuItems[1].id, // Smoked Butter Chicken
            name: createdMenuItems[1].name,
            quantity: 1,
            unitPrice: 540,
            itemTotal: 540,
          },
          {
            menuItemId: createdMenuItems[10].id, // Double Smash Burger
            name: createdMenuItems[10].name,
            quantity: 1,
            unitPrice: 390,
            itemTotal: 390,
          },
          {
            menuItemId: createdMenuItems[13].id, // Passion Fruit Mojito
            name: createdMenuItems[13].name,
            quantity: 1,
            unitPrice: 210,
            itemTotal: 210,
          },
        ],
      },
      payment: {
        create: {
          provider: 'ONLINE_RAZORPAY',
          amount: 1139.5,
          status: 'COMPLETED',
          paymentMethod: 'Card',
        },
      },
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log(`- Created ${tablesData.length} Dining Tables`);
  console.log(`- Created ${categoriesData.length} Categories`);
  console.log(`- Created ${menuItemsData.length} Menu Items`);
  console.log(`- Created 3 User Accounts (admin@royalpalms.com / chef@royalpalms.com / waiter@royalpalms.com)`);
  console.log(`- Created 2 Active Sample Orders (#ORD-1001, #ORD-1002)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
