import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ================= CATEGORIES =================

export const listCategories = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;

    const categories = await prisma.category.findMany({
      where: includeInactive === 'true' ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });

    return res.status(200).json({ success: true, categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list categories', error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl, icon, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        icon: icon || 'UtensilsCrossed',
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    return res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, icon, sortOrder, isActive } = req.body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name, slug }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.status(200).json({ success: true, message: 'Category updated successfully', category });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
};

// ================= MENU ITEMS =================

export const listMenuItems = async (req: Request, res: Response) => {
  try {
    const { categoryId, search, isVeg, isChefSpecial, availableOnly } = req.query;

    const whereClause: any = {};

    if (categoryId && categoryId !== 'all') {
      whereClause.categoryId = categoryId as string;
    }

    if (availableOnly === 'true') {
      whereClause.isAvailable = true;
    }

    if (isVeg !== undefined && isVeg !== '') {
      whereClause.isVeg = isVeg === 'true';
    }

    if (isChefSpecial === 'true') {
      whereClause.isChefSpecial = true;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const items = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return res.status(200).json({ success: true, items });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to list menu items', error: error.message });
  }
};

export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    return res.status(200).json({ success: true, item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch menu item', error: error.message });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isVeg,
      isAvailable,
      isChefSpecial,
      spicyLevel,
      preparationTimeMin,
      calories,
    } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Category, item name, and price are required' });
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        price: parseFloat(price),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        isVeg: isVeg !== undefined ? isVeg : true,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isChefSpecial: isChefSpecial !== undefined ? isChefSpecial : false,
        spicyLevel: spicyLevel !== undefined ? Number(spicyLevel) : 0,
        preparationTimeMin: preparationTimeMin !== undefined ? Number(preparationTimeMin) : 15,
        calories: calories ? Number(calories) : null,
      },
      include: { category: true },
    });

    return res.status(201).json({ success: true, message: 'Menu item created successfully', item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create menu item', error: error.message });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isVeg,
      isAvailable,
      isChefSpecial,
      spicyLevel,
      preparationTimeMin,
      calories,
    } = req.body;

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(categoryId && { categoryId }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isVeg !== undefined && { isVeg }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(isChefSpecial !== undefined && { isChefSpecial }),
        ...(spicyLevel !== undefined && { spicyLevel: Number(spicyLevel) }),
        ...(preparationTimeMin !== undefined && { preparationTimeMin: Number(preparationTimeMin) }),
        ...(calories !== undefined && { calories: calories ? Number(calories) : null }),
      },
      include: { category: true },
    });

    return res.status(200).json({ success: true, message: 'Menu item updated successfully', item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update menu item', error: error.message });
  }
};

export const toggleItemAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const current = await prisma.menuItem.findUnique({ where: { id } });

    if (!current) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !current.isAvailable },
      include: { category: true },
    });

    return res.status(200).json({
      success: true,
      message: `Item marked as ${updated.isAvailable ? 'In Stock' : 'Out of Stock'}`,
      item: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to toggle item availability', error: error.message });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete menu item', error: error.message });
  }
};
