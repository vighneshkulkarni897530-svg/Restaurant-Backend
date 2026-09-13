import prisma from './prisma';
import bcrypt from 'bcryptjs';

export async function ensureDatabaseInitialized() {
  try {
    // 1. Hotel Settings
    const existingSettings = await prisma.hotelSetting.findUnique({ where: { id: 'default' } });
    if (!existingSettings) {
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
      console.log('✅ Initialized default hotel settings');
    }

    // 2. Admin & Staff Users
    const userCount = await prisma.user.count();
    if (userCount === 0) {
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
        ],
      });
      console.log('✅ Initialized default admin and staff accounts');
    }

    // 3. Tables
    const tableCount = await prisma.table.count();
    if (tableCount === 0) {
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

      for (const t of tablesData) {
        await prisma.table.upsert({
          where: { qrToken: t.qrToken },
          update: {},
          create: t,
        });
      }
      console.log('✅ Initialized 10 default dining tables with QR tokens');
    }

    // 4. Categories & Menu Items
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      const catSpecials = await prisma.category.create({
        data: {
          id: 'cat_specials',
          name: 'Chef Specials',
          slug: 'chef-specials',
          description: 'Handcrafted signature dishes curated by our Executive Chef',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          icon: 'Sparkles',
          sortOrder: 1,
          isActive: true,
        },
      });

      const catStarters = await prisma.category.create({
        data: {
          id: 'cat_starters',
          name: 'Starters & Appetizers',
          slug: 'starters',
          description: 'Crisp, fiery and delicious bite-sized beginnings',
          imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
          icon: 'Flame',
          sortOrder: 2,
          isActive: true,
        },
      });

      const catPizzas = await prisma.category.create({
        data: {
          id: 'cat_pizzas',
          name: 'Artisan Pizzas',
          slug: 'pizzas',
          description: 'Wood-fired thin crust Neapolitan pizzas with fresh mozzarella',
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
          icon: 'Pizza',
          sortOrder: 3,
          isActive: true,
        },
      });

      const catBurgers = await prisma.category.create({
        data: {
          id: 'cat_burgers',
          name: 'Burgers & Sliders',
          slug: 'burgers',
          description: 'Juicy gourmet burgers served with golden herb fries',
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
          icon: 'Sandwich',
          sortOrder: 4,
          isActive: true,
        },
      });

      const catMains = await prisma.category.create({
        data: {
          id: 'cat_mains',
          name: 'Main Course',
          slug: 'main-course',
          description: 'Rich royal gravies, aromatic biryanis and gourmet platters',
          imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
          icon: 'UtensilsCrossed',
          sortOrder: 5,
          isActive: true,
        },
      });

      const catBeverages = await prisma.category.create({
        data: {
          id: 'cat_beverages',
          name: 'Beverages & Mocktails',
          slug: 'beverages',
          description: 'Refreshing chilled coolers, artisan shakes and brewed coffees',
          imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
          icon: 'Coffee',
          sortOrder: 6,
          isActive: true,
        },
      });

      const catDesserts = await prisma.category.create({
        data: {
          id: 'cat_desserts',
          name: 'Desserts & Sweets',
          slug: 'desserts',
          description: 'Decadent chocolate delights, cheesecakes and artisanal gelato',
          imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
          icon: 'Cake',
          sortOrder: 7,
          isActive: true,
        },
      });

      const dishes = [
        {
          id: 'item_01',
          categoryId: catSpecials.id,
          name: 'Truffle Butter Glazed Paneer Steak',
          description: 'Char-grilled cottage cheese medallions infused with black truffle oil, served over saffron herb risotto.',
          price: 490,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: true,
          isAvailable: true,
          spicyLevel: 1,
          preparationTimeMin: 20,
          calories: 420,
          sortOrder: 1,
        },
        {
          id: 'item_02',
          categoryId: catSpecials.id,
          name: 'Smoked Butter Chicken Supreme',
          description: 'Tender tandoor-roasted chicken in a velvety slow-simmered makhani gravy with smoked charcoal aroma.',
          price: 540,
          imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
          isVeg: false,
          isChefSpecial: true,
          isAvailable: true,
          spicyLevel: 2,
          preparationTimeMin: 25,
          calories: 560,
          sortOrder: 2,
        },
        {
          id: 'item_03',
          categoryId: catSpecials.id,
          name: 'Royal Awadhi Dum Biryani',
          description: 'Fragrant aged Basmati rice layered with marinated paneer & dry fruits, slow-cooked in a sealed clay pot.',
          price: 460,
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: true,
          isAvailable: true,
          spicyLevel: 2,
          preparationTimeMin: 25,
          calories: 510,
          sortOrder: 3,
        },
        {
          id: 'item_04',
          categoryId: catStarters.id,
          name: 'Crispy Peri-Peri Cheese Cigars',
          description: 'Golden fried crispy spring rolls bursting with molten mozzarella, jalapenos, and house dip.',
          price: 290,
          imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 2,
          preparationTimeMin: 12,
          calories: 340,
          sortOrder: 4,
        },
        {
          id: 'item_05',
          categoryId: catStarters.id,
          name: 'Honey Chilli Garlic Lotus Stem',
          description: 'Crunchy wok-tossed lotus stem slices glazed in spicy honey chilli sauce with roasted sesame.',
          price: 320,
          imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 2,
          preparationTimeMin: 15,
          calories: 280,
          sortOrder: 5,
        },
        {
          id: 'item_06',
          categoryId: catStarters.id,
          name: 'Smoky Malai Chicken Tikka',
          description: 'Juicy boneless chicken thighs marinated in rich cashew cream, cardamom, and green chillies.',
          price: 390,
          imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
          isVeg: false,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 1,
          preparationTimeMin: 18,
          calories: 410,
          sortOrder: 6,
        },
        {
          id: 'item_07',
          categoryId: catPizzas.id,
          name: 'Margherita Burrata Speciale',
          description: 'San Marzano tomato sauce, fresh buffalo burrata, garden basil, and extra virgin olive oil on hand-stretched dough.',
          price: 420,
          imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: true,
          isAvailable: true,
          spicyLevel: 0,
          preparationTimeMin: 18,
          calories: 620,
          sortOrder: 7,
        },
        {
          id: 'item_08',
          categoryId: catPizzas.id,
          name: 'Fiery BBQ Paneer & Bell Pepper Pizza',
          description: 'Zesty barbecue sauce, spiced roasted paneer, grilled bell peppers, red onions, and smoked cheddar.',
          price: 460,
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 2,
          preparationTimeMin: 20,
          calories: 680,
          sortOrder: 8,
        },
        {
          id: 'item_09',
          categoryId: catPizzas.id,
          name: 'Truffle Mushroom & Smoked Chicken Pizza',
          description: 'Wild forest mushrooms, roasted rosemary chicken strips, mozzarella blend, and aromatic white truffle oil.',
          price: 520,
          imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
          isVeg: false,
          isChefSpecial: true,
          isAvailable: true,
          spicyLevel: 1,
          preparationTimeMin: 20,
          calories: 710,
          sortOrder: 9,
        },
        {
          id: 'item_10',
          categoryId: catBurgers.id,
          name: 'Gourmet Truffle Portobello Burger',
          description: 'Crispy herb-crusted portobello mushroom stuffed with gouda, caramelized balsamic onions, and truffle aioli.',
          price: 360,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 1,
          preparationTimeMin: 15,
          calories: 520,
          sortOrder: 10,
        },
        {
          id: 'item_11',
          categoryId: catBurgers.id,
          name: 'Double Cheddar Gourmet Chicken Smash',
          description: 'Two smashed grilled chicken patties, double aged cheddar, house pickle relish, and smoky secret sauce in brioche.',
          price: 390,
          imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
          isVeg: false,
          isChefSpecial: true,
          isAvailable: true,
          spicyLevel: 2,
          preparationTimeMin: 15,
          calories: 640,
          sortOrder: 11,
        },
        {
          id: 'item_12',
          categoryId: catMains.id,
          name: 'Paneer Lababdar Royal Platter',
          description: 'Creamy malai paneer cubes simmered in a luscious onion-tomato cashew gravy, served with flaky butter parathas.',
          price: 430,
          imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 1,
          preparationTimeMin: 18,
          calories: 540,
          sortOrder: 12,
        },
        {
          id: 'item_13',
          categoryId: catMains.id,
          name: 'Dal Bukhara (Slow Cooked 18 Hours)',
          description: 'Legendary black lentils simmered overnight with tomatoes, cream, and pure butter on charcoal embers.',
          price: 340,
          imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: true,
          isAvailable: true,
          spicyLevel: 1,
          preparationTimeMin: 15,
          calories: 460,
          sortOrder: 13,
        },
        {
          id: 'item_14',
          categoryId: catBeverages.id,
          name: 'Sparkling Passion Fruit & Mint Mojito',
          description: 'Zesty crushed fresh lime, garden mint leaves, organic passion fruit pulp, and effervescent soda over crushed ice.',
          price: 210,
          imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 0,
          preparationTimeMin: 8,
          calories: 140,
          sortOrder: 14,
        },
        {
          id: 'item_15',
          categoryId: catBeverages.id,
          name: 'Classic Hazelnut Cold Brew Frappe',
          description: 'Single-origin Arabica cold brew espresso blended with roasted hazelnut cream, chocolate drizzle, and vanilla bean cream.',
          price: 240,
          imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 0,
          preparationTimeMin: 8,
          calories: 220,
          sortOrder: 15,
        },
        {
          id: 'item_16',
          categoryId: catDesserts.id,
          name: 'Molten Belgian Chocolate Lava Cake',
          description: 'Warm dark chocolate cake with a gushing molten ganache center, paired with Madagascar vanilla bean gelato.',
          price: 280,
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: true,
          isAvailable: true,
          spicyLevel: 0,
          preparationTimeMin: 12,
          calories: 450,
          sortOrder: 16,
        },
        {
          id: 'item_17',
          categoryId: catDesserts.id,
          name: 'New York Baked Berry Cheesecake',
          description: 'Velvety Philadelphia cream cheese filling on a buttery graham cracker crust, topped with wild blueberry compote.',
          price: 310,
          imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80',
          isVeg: true,
          isChefSpecial: false,
          isAvailable: true,
          spicyLevel: 0,
          preparationTimeMin: 10,
          calories: 380,
          sortOrder: 17,
        },
      ];

      for (const d of dishes) {
        await prisma.menuItem.upsert({
          where: { id: d.id },
          update: {},
          create: d,
        });
      }
      console.log('✅ Initialized 17 gourmet dishes and categories');
    }
  } catch (error) {
    console.error('⚠️ Database initialization check failed:', error);
  }
}
